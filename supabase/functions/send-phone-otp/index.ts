import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const CODE_TTL_MINUTES = 10;
const MAX_ATTEMPTS = 5;
const RESEND_COOLDOWN_SECONDS = 60;
const MAX_SENDS_PER_HOUR = 5;

function normalizePhone(raw: string): string | null {
  const trimmed = raw.replace(/[\s\-().]/g, "");
  const withPlus = trimmed.startsWith("+") ? trimmed : `+${trimmed}`;
  return /^\+[1-9]\d{7,14}$/.test(withPlus) ? withPlus : null;
}

async function sha256(input: string): Promise<string> {
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(bytes)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Pluggable SMS delivery. Add TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN / TWILIO_FROM_NUMBER
// secrets to switch from dev mode to real SMS with no code changes here.
async function sendSms(phone: string, code: string): Promise<{ delivered: boolean; devCode?: string }> {
  const sid = Deno.env.get("TWILIO_ACCOUNT_SID");
  const token = Deno.env.get("TWILIO_AUTH_TOKEN");
  const from = Deno.env.get("TWILIO_FROM_NUMBER");

  if (sid && token && from) {
    const body = new URLSearchParams({
      To: phone,
      From: from,
      Body: `TurAkcakasa dogrulama kodunuz: ${code}`,
    });
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${btoa(`${sid}:${token}`)}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    });
    return { delivered: res.ok };
  }

  // Dev mode: no SMS provider configured. Surface the code so the flow is testable
  // end-to-end; it is hashed in the database and expires in 10 minutes.
  console.log(`[send-phone-otp] DEV MODE code for ${phone}: ${code}`);
  return { delivered: false, devCode: code };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } },
    );

    // Identify the caller from their JWT (may be null for logged-out calls).
    const token = authHeader.replace("Bearer ", "");
    let userId: string | null = null;
    if (token) {
      const { data } = await supabase.auth.getUser(token);
      userId = data?.user?.id ?? null;
    }

    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    let body: { action?: string; phone?: string; code?: string };
    try {
      body = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const phone = normalizePhone(body.phone ?? "");
    if (!phone) {
      return new Response(JSON.stringify({ error: "invalid_phone" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // --- SEND ---
    if (body.action === "send") {
      const since = new Date(Date.now() - RESEND_COOLDOWN_SECONDS * 1000).toISOString();
      const { data: recent } = await serviceClient
        .from("phone_verification_codes")
        .select("id, created_at")
        .eq("phone", phone)
        .gte("created_at", since)
        .limit(1);
      if (recent && recent.length > 0) {
        return new Response(JSON.stringify({ error: "cooldown" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const hourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const { count } = await serviceClient
        .from("phone_verification_codes")
        .select("id", { count: "exact", head: true })
        .eq("phone", phone)
        .gte("created_at", hourAgo);
      if ((count ?? 0) >= MAX_SENDS_PER_HOUR) {
        return new Response(JSON.stringify({ error: "rate_limited" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const code = String(Math.floor(100000 + Math.random() * 900000));
      const codeHash = await sha256(code);
      const expiresAt = new Date(Date.now() + CODE_TTL_MINUTES * 60 * 1000).toISOString();

      const { error: insertErr } = await serviceClient.rpc("set_phone_verification_code", {
        p_phone: phone,
        p_code_hash: codeHash,
        p_user_id: userId,
        p_expires_at: expiresAt,
      });
      if (insertErr) {
        return new Response(JSON.stringify({ error: "storage_failed" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const delivery = await sendSms(phone, code);
      return new Response(
        JSON.stringify({
          sent: true,
          delivered: delivery.delivered,
          expires_in: CODE_TTL_MINUTES * 60,
          ...(delivery.devCode ? { dev_code: delivery.devCode } : {}),
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // --- VERIFY ---
    if (body.action === "verify") {
      if (!userId) {
        return new Response(JSON.stringify({ error: "unauthenticated" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const code = (body.code ?? "").replace(/\D/g, "");
      if (code.length !== 6) {
        return new Response(JSON.stringify({ error: "invalid_code" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: rows } = await serviceClient
        .from("phone_verification_codes")
        .select("id, code_hash, expires_at, consumed_at, attempts")
        .eq("phone", phone)
        .order("created_at", { ascending: false })
        .limit(1);

      const row = rows?.[0];
      if (!row) {
        return new Response(JSON.stringify({ error: "no_code" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (row.consumed_at) {
        return new Response(JSON.stringify({ error: "already_used" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (new Date(row.expires_at) < new Date()) {
        return new Response(JSON.stringify({ error: "expired" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (row.attempts >= MAX_ATTEMPTS) {
        return new Response(JSON.stringify({ error: "too_many_attempts" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const codeHash = await sha256(code);
      if (codeHash !== row.code_hash) {
        await serviceClient
          .from("phone_verification_codes")
          .update({ attempts: row.attempts + 1 })
          .eq("id", row.id);
        return new Response(JSON.stringify({ error: "wrong_code", attempts_left: Math.max(0, MAX_ATTEMPTS - row.attempts - 1) }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Success: consume the code and flip profiles.phone_verified atomically.
      const { error: consumeErr } = await serviceClient
        .from("phone_verification_codes")
        .update({ consumed_at: new Date().toISOString() })
        .eq("id", row.id)
        .is("consumed_at", null);
      if (consumeErr) {
        return new Response(JSON.stringify({ error: "consume_failed" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      await serviceClient.rpc("mark_phone_verified", { p_user_id: userId, p_phone: phone });
      return new Response(JSON.stringify({ verified: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "unknown_action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message ?? "server_error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
