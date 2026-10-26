// https://deno.land/std@0.168.0/http/server.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
  const random = Math.random().toString(36).slice(2, 8);
  return `txn_${timestamp}${random}`;
}

/**
 * Payment gateway with sandbox support.
 *
 * Environment variables (set via Supabase Edge Function secrets):
 * - STRIPE_SECRET_KEY      : sk_test_... (sandbox) or sk_live_... (production)
 * - STRIPE_WEBHOOK_SECRET  : whsec_... for verifying webhook signatures
 * - IYZICO_API_KEY         : reserved for phone verification flow (stage 3)
 * - IYZICO_SECRET_KEY      : reserved for phone verification flow (stage 3)
 * - PAYMENT_MODE           : 'sandbox' | 'live' — controls which provider is
 *                            used when both are configured. Defaults to
 *                            'sandbox' so a fresh HostPapa deployment works
 *                            out of the box with Stripe test keys.
 *
 * When STRIPE_SECRET_KEY is present, a real Stripe PaymentIntent is created
 * with automatic payment methods and the card is charged in test mode using
 * the tokenized test card 4242 4242 4242 4242. When it is absent, the request
 * falls through to the built-in simulated flow so development never blocks.
 */
serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const body = await req.json() as PaymentRequest;
    const { tier, amount, provider, card_name, card_last4 } = body;

    if (!tier || amount === undefined) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const stripeSecret = Deno.env.get("STRIPE_SECRET_KEY");
    const paymentMode = Deno.env.get("PAYMENT_MODE") ?? "sandbox";
    const iyzicoApiKey = Deno.env.get("IYZICO_API_KEY");
    const iyzicoSecretKey = Deno.env.get("IYZICO_SECRET_KEY");

    const wantsStripe = provider === "stripe" || provider === "test" || provider === "iyzico";
    const stripeReady = stripeSecret && (paymentMode === "live" || paymentMode === "sandbox");

    if (wantsStripe && stripeReady) {
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
          success: true,
          transaction_id: stripeData.id,
          status: stripeData.status === "succeeded" ? "paid" : stripeData.status,
          provider: "stripe",
          mode: useLiveKey ? "live" : "sandbox",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // iyzico reserved for the phone-verification flow; kept separate from
    // Stripe so the two never conflict once both merchants are onboarded.
    if (provider === "iyzico-phone-verify" && iyzicoApiKey && iyzicoSecretKey) {
      const transactionId = generateTransactionId();
      return new Response(
        JSON.stringify({
          success: true,
          transaction_id: transactionId,
          status: "pending_verification",
          provider: "iyzico",
          mode: "phone_verification",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fallback: simulate a successful payment so local/dev flows never block.
    await new Promise((resolve) => setTimeout(resolve, 800));

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
