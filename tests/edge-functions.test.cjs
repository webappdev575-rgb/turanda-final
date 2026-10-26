const { test } = require('node:test');
const assert = require('node:assert/strict');
const { edgeHandler, loadModule } = require('./load-module.cjs');

const userId = '11111111-1111-4111-8111-111111111111';
const env = { SUPABASE_URL: 'https://example.test', SUPABASE_ANON_KEY: 'local-anon', SUPABASE_SERVICE_ROLE_KEY: 'local-service' };
const request = (body, token = 'user-token') => new Request('http://localhost/function', {
  method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(body),
});
function clientMock(profile) {
  const updates = [];
  return {
    updates,
    auth: { getUser: async () => ({ data: { user: { id: userId } }, error: null }) },
    from: () => {
      let updating = false;
      const query = {
        select: () => query, eq: () => query,
        update: (values) => { updates.push(values); updating = true; return query; },
        maybeSingle: async () => ({ data: updating ? { id: userId } : profile, error: null }),
      };
      return query;
    },
  };
}

test('all admin actions update their allowed column; unknown RPC names are rejected', async () => {
  const client = clientMock({ is_admin: true });
  const handler = edgeHandler('admin-user-action', { 'npm:@supabase/supabase-js@2.58.0': { createClient: () => client } }, env);
  for (const [action, column] of Object.entries({ set_admin_status: 'is_admin', set_user_ban_status: 'is_banned', set_moderator_status: 'is_moderator', set_editor_status: 'is_editor' })) {
    const response = await handler(request({ action, userId, value: true }));
    assert.equal(response.status, 200);
    assert.equal(client.updates.at(-1)[column], true);
  }
  for (const action of ['delete_all_users', '__proto__', 'toString']) {
    assert.equal((await handler(request({ action, userId, value: true }))).status, 400);
  }
  assert.equal(client.updates.length, 4);
});

test('regular and banned admin users cannot change privileges', async () => {
  for (const profile of [{ is_admin: false }, { is_admin: true, is_banned: true }]) {
    const client = clientMock(profile);
    const handler = edgeHandler('admin-user-action', { 'npm:@supabase/supabase-js@2.58.0': { createClient: () => client } }, env);
    assert.equal((await handler(request({ action: 'set_admin_status', userId, value: true }))).status, 403);
    assert.equal(client.updates.length, 0);
  }
});

test('staff authorization validates identity, rejects banned users, and separates editorial access', async () => {
  for (const [profile, allowEditorial, expected] of [
    [{ is_admin: true }, false, true], [{ is_editor: true }, false, false],
    [{ is_editor: true }, true, true], [{ is_moderator: true }, true, true],
    [{ is_admin: true, is_banned: true }, true, false], [{}, true, false],
  ]) {
    const client = clientMock(profile);
    const { isAuthorizedStaff } = loadModule('supabase/functions/_shared/authorize.ts', {
      'npm:@supabase/supabase-js@2.58.0': { createClient: (_url, _key, options) => {
        assert.equal(options.global.headers.Authorization, 'Bearer user-token');
        return client;
      } },
    }, { Deno: { env: { get: (key) => env[key] } } });
    assert.equal(await isAuthorizedStaff(request({}), allowEditorial), expected);
    assert.equal(await isAuthorizedStaff(new Request('http://localhost')), false);
    assert.equal(await isAuthorizedStaff(request({}, 'local-service')), true);
  }
});

test('privileged ingestion and delivery reject anonymous requests before provider or database calls', async () => {
  for (const name of ['fetch-commodities', 'generate-thumbnail', 'send-notification']) {
    let touched = false;
    const handler = edgeHandler(name, {
      '../_shared/authorize.ts': { isAuthorizedStaff: async () => false },
      'npm:@supabase/supabase-js@2.58.0': { createClient: () => { touched = true; throw Error('unexpected access'); } },
    }, env);
    assert.equal((await handler(new Request('http://localhost', { method: 'OPTIONS' }))).status, 200);
    assert.equal((await handler(request({}))).status, 401);
    assert.equal(touched, false);
  }
});

test('OTP never returns a code when a provider is missing in production', async () => {
  const client = clientMock({});
  const handler = edgeHandler('send-phone-otp', { 'npm:@supabase/supabase-js@2.58.0': { createClient: () => client } }, { ...env, APP_ENV: 'production', PHONE_OTP_DEV_MODE: 'true' });
  const response = await handler(request({ action: 'send', phone: '+905321234567' }));
  assert.equal(response.status, 503);
  assert.equal((await response.json()).dev_code, undefined);
});

test('production payment cannot fall back to a simulated success', async () => {
  const client = clientMock({});
  const handler = edgeHandler('process-payment', { 'npm:@supabase/supabase-js@2.58.0': { createClient: () => client } }, { ...env, APP_ENV: 'production', ALLOW_TEST_PAYMENTS: 'true' });
  assert.equal((await handler(request({ tier: 'featured', amount: 499, provider: 'test' }))).status, 503);
  for (const amount of [0, -1, 1, '499']) {
    assert.equal((await handler(request({ tier: 'featured', amount, provider: 'test' }))).status, 400);
  }
});

test('Stripe intents requiring a payment method are never reported as paid', async () => {
  const client = clientMock({});
  const handler = edgeHandler('process-payment', { 'npm:@supabase/supabase-js@2.58.0': { createClient: () => client } }, {
    ...env, STRIPE_SECRET_KEY: 'sk_test_synthetic', PAYMENT_MODE: 'sandbox',
  }, { fetch: async () => Response.json({ id: 'pi_local', status: 'requires_payment_method' }) });
  const response = await handler(request({ tier: 'featured', amount: 499, provider: 'stripe' }));
  assert.equal(response.status, 200);
  const result = await response.json();
  assert.equal(result.success, false);
  assert.equal(result.status, 'requires_payment_method');
});

test('payment simulation requires all explicit development flags', async () => {
  const client = clientMock({});
  const handler = edgeHandler('process-payment', { 'npm:@supabase/supabase-js@2.58.0': { createClient: () => client } }, {
    ...env, APP_ENV: 'development', ALLOW_TEST_PAYMENTS: 'true', PAYMENT_MODE: 'sandbox',
  });
  const result = await (await handler(request({ tier: 'featured', amount: 499, provider: 'test' }))).json();
  assert.equal(result.success, true);
  assert.equal(result.test_mode, true);
  assert.equal(result.status, 'paid');
});

test('reCAPTCHA rejects development tokens in production and verifies action and encoded input', async () => {
  const responses = { 'next/server': { NextResponse: { json: (body, init) => Response.json(body, init) } } };
  const invoke = (handler, body) => handler(new Request('http://localhost/api/recaptcha-verify', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  }));
  const production = loadModule('app/api/recaptcha-verify/route.ts', responses, { process: { env: { NODE_ENV: 'production' } } });
  assert.equal((await invoke(production.POST, { token: 'no-key-dev-mode' })).status, 503);
  assert.equal((await invoke(production.POST, { token: 123 })).status, 400);
  const configured = loadModule('app/api/recaptcha-verify/route.ts', responses, {
    process: { env: { NODE_ENV: 'production', RECAPTCHA_SECRET_KEY: 'local&secret' } },
    fetch: async (_url, options) => {
      assert.equal(options.body.get('secret'), 'local&secret');
      assert.equal(options.body.get('response'), 'token&value');
      return Response.json({ success: true, score: 0.9, action: 'signup' });
    },
  });
  assert.equal((await (await invoke(configured.POST, { token: 'token&value', action: 'signup' })).json()).success, true);
  assert.equal((await (await invoke(configured.POST, { token: 'token&value', action: 'checkout' })).json()).success, false);
});
