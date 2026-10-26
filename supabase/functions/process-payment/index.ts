import { createClient } from "npm:@supabase/supabase-js@2.58.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface PaymentRequest {
  tier: string;
  amount: number;
  job_id: string | null;
  provider: string;
  card_name: string;
  card_last4: string;
}

function generateTransactionId(): string {
  const timestamp = Date.now().toString(36);
  const random = crypto.randomUUID();
  return `txn_${timestamp}${random}`;
}

/** Stripe intents require provider confirmation before reporting paid.
 * Simulation is available only with APP_ENV=development,
 * PAYMENT_MODE=sandbox and ALLOW_TEST_PAYMENTS=true.
 */
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
    const client = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!);
    const { data: { user }, error: authError } = await client.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const body = await req.json() as PaymentRequest;
    const { tier, amount, provider, card_name, card_last4 } = body;

    const expectedPrices: Record<string, number> = { featured: 499, pinned: 899 };
    if (!Object.hasOwn(expectedPrices, tier) || typeof amount !== "number" || amount !== expectedPrices[tier] ||
        !["stripe", "test"].includes(provider)) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const stripeSecret = Deno.env.get("STRIPE_SECRET_KEY");
    const paymentMode = Deno.env.get("PAYMENT_MODE") ?? "sandbox";

    const wantsStripe = provider === "stripe";
    const stripeReady = stripeSecret && (paymentMode === "live" || paymentMode === "sandbox");

    if (wantsStripe && stripeReady) {
      if ((paymentMode === "sandbox" && !stripeSecret.startsWith("sk_test_")) ||
          (paymentMode === "live" && !stripeSecret.startsWith("sk_live_"))) {
        return new Response(JSON.stringify({ success: false, error: "Payment mode does not match provider configuration" }), {
          status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const isLive = paymentMode === "live" && stripeSecret.startsWith("sk_live_");
      const useLiveKey = isLive && paymentMode === "live";

      const params = new URLSearchParams();
      params.set("amount", String(Math.round(amount * 100)));
      params.set("currency", "try");
      params.set("description", `Turanda ${tier} listing`);
      params.set("automatic_payment_methods[enabled]", "true");
      params.set("metadata[tier]", tier);
      if (card_name) params.set("metadata[card_name]", card_name);
      if (card_last4) params.set("metadata[card_last4]", card_last4);

      const stripeRes = await fetch("https://api.stripe.com/v1/payment_intents", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${stripeSecret}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params,
      });

      const stripeData = await stripeRes.json() as {
        id?: string;
        status?: string;
        error?: { message?: string };
      };

      if (!stripeRes.ok || !stripeData.id) {
        return new Response(
          JSON.stringify({
            success: false,
            error: stripeData.error?.message || "Stripe payment failed",
          }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({
          success: stripeData.status === "succeeded",
          transaction_id: stripeData.id,
          status: stripeData.status === "succeeded" ? "paid" : stripeData.status,
          provider: "stripe",
          mode: useLiveKey ? "live" : "sandbox",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Simulated payments require explicit development configuration.
    if (provider !== "test" || paymentMode !== "sandbox" ||
        Deno.env.get("APP_ENV") !== "development" || Deno.env.get("ALLOW_TEST_PAYMENTS") !== "true") {
      return new Response(JSON.stringify({ success: false, error: "Payment provider is not configured" }), {
        status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const transactionId = generateTransactionId();
    return new Response(
      JSON.stringify({
        success: true,
        transaction_id: transactionId,
        status: "paid",
        provider: "test",
        test_mode: true,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (_error) {
    return new Response(
      JSON.stringify({ success: false, error: "Payment processing failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
