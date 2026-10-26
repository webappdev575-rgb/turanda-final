import { createClient } from "npm:@supabase/supabase-js@2.118.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface AdminUserActionRequest {
  action: "set_admin_status" | "set_user_ban_status" | "set_moderator_status" | "set_editor_status";
  userId: string;
  value: boolean;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing auth token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userErr } = await userClient.auth.getUser();
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: profile } = await userClient
      .from("profiles")
      .select("is_admin, is_banned")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile?.is_admin || profile.is_banned) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json() as AdminUserActionRequest;
    const { action, userId, value } = body;

    if (!["set_admin_status", "set_user_ban_status", "set_moderator_status", "set_editor_status"].includes(action) || typeof userId !== "string" || !/^[0-9a-f-]{36}$/i.test(userId) || typeof value !== "boolean") {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const rpcParams: Record<string, string | boolean> = { p_user_id: userId };
    if (action === "set_admin_status") {
      rpcParams.p_is_admin = value;
    } else if (action === "set_moderator_status") {
      rpcParams.p_is_moderator = value;
    } else if (action === "set_editor_status") {
      rpcParams.p_is_editor = value;
    } else {
      rpcParams.p_is_banned = value;
    }
    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    if (action === "set_editor_status") {
      const { error: updateErr } = await adminClient
        .from("profiles")
        .update({ is_editor: value })
        .eq("id", userId);
      if (updateErr) throw updateErr;
    } else {
      const { error: rpcErr } = await adminClient.rpc(action, rpcParams);
      if (rpcErr) throw rpcErr;
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Administrative action failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
