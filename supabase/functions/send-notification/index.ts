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

    // Batch delivery handles pending rows; explicit retries may include failed rows.
    let url = `${SUPABASE_URL}/rest/v1/notifications?select=*`;
    if (notificationId) {
      url += `&id=eq.${notificationId}&status=in.(pending,failed)`;
    } else {
      url += `&status=eq.pending&limit=${batch || 20}`;
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
      let started = false;
      try {
        // Reserve before contacting Resend. A crash or unknown outcome must not
        // leave the row eligible for another batch or an unreconciled retry.
        const reservation = await fetch(`${SUPABASE_URL}/rest/v1/notifications?id=eq.${notif.id}&status=eq.${notif.status === 'pending' ? 'pending' : 'failed'}`, {
          method: "PATCH",
          headers: { ...supabaseHeaders, Prefer: "return=representation" },
          body: JSON.stringify({
            status: "uncertain",
            error_message: "Delivery started; reconcile provider status before retrying an unconfirmed delivery.",
          }),
        });
        if (!reservation.ok) { failedCount++; continue; }
        const reserved = await reservation.json();
        if (!Array.isArray(reserved) || reserved.length === 0) continue;
        started = true;
        const delivery = reserved[0];
        const resendResponse = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${RESEND_API_KEY}`,
            "Content-Type": "application/json",
            "Idempotency-Key": `notification/${notif.id}`,
          },
          body: JSON.stringify({
            from: "Turanda <noreply@resend.dev>",
            to: delivery.recipient_email,
            subject: delivery.subject,
            html: delivery.body,
          }),
        });

        // Another request may still be completing; never downgrade its status.
        if (resendResponse.status === 409) { failedCount++; continue; }
        if (resendResponse.ok) {
          const confirmation = await fetch(`${SUPABASE_URL}/rest/v1/notifications?id=eq.${notif.id}&status=eq.uncertain`, {
            method: "PATCH",
            headers: { ...supabaseHeaders, Prefer: "return=representation" },
            body: JSON.stringify({ status: "sent", sent_at: new Date().toISOString(), error_message: null }),
          });
          if (!confirmation.ok) { failedCount++; continue; }
          const confirmed = await confirmation.json();
          if (Array.isArray(confirmed) && confirmed.some(row => row.status === 'sent')) sentCount++;
          else failedCount++;
        } else {
          const errText = await resendResponse.text();
          // Only definite client rejections are retryable. Timeouts/server errors
          // may follow an accepted send and require provider reconciliation.
          const definiteRejection = resendResponse.status >= 400 && resendResponse.status < 500 && resendResponse.status !== 408;
          await fetch(`${SUPABASE_URL}/rest/v1/notifications?id=eq.${notif.id}&status=eq.uncertain`, {
            method: "PATCH", headers: supabaseHeaders,
            body: JSON.stringify({ status: definiteRejection ? "failed" : "uncertain", error_message: errText.substring(0, 500) }),
          });
          failedCount++;
        }
      } catch (err) {
        if (started) {
          const errMsg = err instanceof Error ? err.message : String(err);
          // Reservation already excludes retries, even if this diagnostic write fails.
          await fetch(`${SUPABASE_URL}/rest/v1/notifications?id=eq.${notif.id}&status=eq.uncertain`, {
            method: "PATCH", headers: supabaseHeaders,
            body: JSON.stringify({ error_message: `Unconfirmed delivery: ${errMsg}`.substring(0, 500) }),
          }).catch(() => undefined);
        }
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
