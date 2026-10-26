import { createClient } from "npm:@supabase/supabase-js@2.58.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const CODE_TTL_MINUTES = 10;

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
  if (Deno.env.get("APP_ENV") === "development" && Deno.env.get("PHONE_OTP_DEV_MODE") === "true") {
    return { delivered: false, devCode: code };
  }
  throw new Error("SMS provider is not configured");
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
      const smsConfigured = ["TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN", "TWILIO_FROM_NUMBER"]
        .every((key) => Boolean(Deno.env.get(key)));
      const devMode = Deno.env.get("APP_ENV") === "development" && Deno.env.get("PHONE_OTP_DEV_MODE") === "true";
      if (!smsConfigured && !devMode) {
        return new Response(JSON.stringify({ error: "sms_not_configured" }), {
          status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      // Rejection sampling avoids bias when reducing to a six-digit code.
      const random = new Uint32Array(1);
      do { crypto.getRandomValues(random); } while (random[0] >= 4294800000);
      const code = String(100000 + random[0] % 900000);
      const codeHash = await sha256(code);
      const expiresAt = new Date(Date.now() + CODE_TTL_MINUTES * 60 * 1000).toISOString();

      const { error: insertErr } = await serviceClient.rpc("set_phone_verification_code", {
        p_phone: phone,
        p_code_hash: codeHash,
        p_user_id: userId,
        p_expires_at: expiresAt,
      });
      if (insertErr) {
        const rateError = ["cooldown", "rate_limited"].find((message) => insertErr.message === message);
        return new Response(JSON.stringify({ error: rateError ?? "storage_failed" }), {
          status: rateError ? 429 : 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const delivery = await sendSms(phone, code);
      if (!delivery.delivered && !delivery.devCode) {
        return new Response(JSON.stringify({ error: "delivery_failed" }), {
          status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
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

      const { data: result, error: verificationError } = await serviceClient.rpc("verify_phone_verification_code", {
        p_user_id: userId,
        p_phone: phone,
        p_code_hash: await sha256(code),
      });
      if (verificationError) throw verificationError;
      if (!result?.verified) {
        return new Response(JSON.stringify(result ?? { error: "verification_failed" }), {
          status: result?.error === "too_many_attempts" ? 429 : 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ verified: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "unknown_action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "server_error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
