import { authorizeStaff } from '../_shared/authorization.ts';
Deno.serve(async (req: Request) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
  };

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json", Allow: "POST, OPTIONS" } });
  }
  if (!(await authorizeStaff(req, ['is_admin']))) {
    return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  try {
    const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY } = Deno.env.toObject();

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return new Response(JSON.stringify({ error: "Missing Supabase configuration" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!RESEND_API_KEY) {
      return new Response(JSON.stringify({ error: "RESEND_API_KEY not configured. Notifications will remain pending." }), {
        status: 503,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const { notificationId, batch } = body;
    if ((notificationId !== undefined && (typeof notificationId !== 'string' || !/^[0-9a-f-]{36}$/i.test(notificationId))) ||
        (batch !== undefined && (!Number.isInteger(batch) || batch < 1 || batch > 50))) {
      return new Response(JSON.stringify({ error: 'Invalid notification request' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseHeaders = {
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      "Content-Type": "application/json",
    };

    // Fetch notifications to send
    let url = `${SUPABASE_URL}/rest/v1/notifications?select=*&status=eq.pending`;
    let filterParam = "";

    if (notificationId) {
      filterParam = `&id=eq.${notificationId}`;
      url += filterParam;
    } else {
      url += `&limit=${batch || 20}`;
    }

    const fetchResponse = await fetch(url, {
      headers: supabaseHeaders,
    });

    if (!fetchResponse.ok) {
      const errText = await fetchResponse.text();
      return new Response(JSON.stringify({ error: `Failed to fetch notifications: ${errText}` }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const notifications = await fetchResponse.json();

    if (!notifications || notifications.length === 0) {
      return new Response(JSON.stringify({ sent: 0, message: "No pending notifications" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let sentCount = 0;
    let failedCount = 0;

    for (const notif of notifications) {
      try {
        const resendResponse = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "Turanda <noreply@resend.dev>",
            to: notif.recipient_email,
            subject: notif.subject,
            html: notif.body,
          }),
        });

        if (resendResponse.ok) {
          // Mark as sent
          await fetch(`${SUPABASE_URL}/rest/v1/notifications?id=eq.${notif.id}`, {
            method: "PATCH",
            headers: supabaseHeaders,
            body: JSON.stringify({
              status: "sent",
              sent_at: new Date().toISOString(),
              error_message: null,
            }),
          });
          sentCount++;
        } else {
          const errText = await resendResponse.text();
          await fetch(`${SUPABASE_URL}/rest/v1/notifications?id=eq.${notif.id}`, {
            method: "PATCH",
            headers: supabaseHeaders,
            body: JSON.stringify({
              status: "failed",
              error_message: errText.substring(0, 500),
            }),
          });
          failedCount++;
        }
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        await fetch(`${SUPABASE_URL}/rest/v1/notifications?id=eq.${notif.id}`, {
          method: "PATCH",
          headers: supabaseHeaders,
          body: JSON.stringify({
            status: "failed",
            error_message: errMsg.substring(0, 500),
          }),
        });
        failedCount++;
      }
    }

    return new Response(JSON.stringify({
      sent: sentCount,
      failed: failedCount,
      total: notifications.length,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: errMsg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
