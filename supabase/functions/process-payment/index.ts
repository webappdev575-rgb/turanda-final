// A payment intent is not proof of payment. Re-enable only after tokenized
// checkout, server-owned prices/ownership checks, and signed webhooks exist.
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
Deno.serve((req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  return new Response(JSON.stringify({ success: false, error: 'Online payments are not available. Please contact support.' }), {
    status: req.method === 'POST' ? 503 : 405,
    headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
});
