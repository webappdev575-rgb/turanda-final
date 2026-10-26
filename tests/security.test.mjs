import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import ts from 'typescript';
import { JSDOM } from 'jsdom';
import createDOMPurify from 'dompurify';
import { validateEnvironment } from '../scripts/check-env.mjs';

const require = createRequire(import.meta.url);
function load(file, globals = {}, imports = {}) {
  const code = ts.transpileModule(fs.readFileSync(new URL(`../${file}`, import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText;
  const context = vm.createContext({ exports: {}, require: name => imports[name] || require(name),
    URL, URLSearchParams, Request, Response, AbortSignal, crypto: globalThis.crypto, TextEncoder, ...globals });
  vm.runInContext(code, context, { filename: file });
  return context.exports;
}
function edge(file, env = {}, imports = {}, globals = {}) {
  let handler;
  load(file, { ...globals, Deno: { env: { get: key => env[key], toObject: () => ({ ...env }) }, serve: value => { handler = value; } } }, imports);
  return handler;
}
const env = { SUPABASE_URL: 'https://synthetic.invalid', SUPABASE_ANON_KEY: 'public-test', SUPABASE_SERVICE_ROLE_KEY: 'private-test' };
const request = (token, body = {}) => new Request('https://local.invalid/', { method: 'POST',
  headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

test('redirects preserve local paths and reject executable or external destinations', () => {
  const { safeRedirect } = load('lib/safe-redirect.ts');
  for (const bad of ['https://evil.invalid', '//evil.invalid', '/\\evil.invalid', 'javascript:alert(1)', '/\t/evil.invalid', null]) {
    assert.equal(safeRedirect(bad, '/jobs'), '/jobs');
  }
  assert.equal(safeRedirect('/messages?c=123#latest', '/jobs'), '/messages?c=123#latest');
});

test('SVG sanitization removes active content and preserves drawing primitives', () => {
  const window = new JSDOM('').window;
  const { sanitizeSvg, isValidSvg } = load('lib/svg-sanitizer.ts', { window, DOMParser: window.DOMParser }, { dompurify: createDOMPurify(window) });
  for (const payload of [
    '<svg xmlns="http://www.w3.org/2000/svg" onload=alert(1)><path d="M0 0h1"/><script>alert(1)</script></svg>',
    '<svg xmlns="http://www.w3.org/2000/svg"><foreignObject><img src=x onerror=alert(1) /></foreignObject><use href="javascript:alert(1)" /></svg>',
    '<svg><style>@import url(https://evil.invalid)</style><a href="javascript:alert(1)"><text>x</text></a><image href="https://evil.invalid"/></svg>',
  ]) {
    const clean = sanitizeSvg(payload);
    assert.doesNotMatch(clean, /onload|onerror|script|foreignObject|<style|href|<image|<use/i);
  }
  assert.match(sanitizeSvg('<svg><path d="M0 0h1" fill="red"/></svg>'), /<path/);
  assert.equal(isValidSvg('<svg><path></svg>'), false);
  assert.equal(isValidSvg('<svg xmlns="http://www.w3.org/2000/svg"><path /></svg>'), true);
  window.close();
});

test('staff authorization requires a validated user and an allowed role', async () => {
  let role = { is_admin: true, is_banned: false };
  const { authorizeStaff } = load('supabase/functions/_shared/authorization.ts', {
    Deno: { env: { get: key => env[key] } },
    fetch: async url => Response.json(String(url).includes('/auth/') ? { id: 'user-id' } : [role]),
  });
  assert.equal(await authorizeStaff(request()), false);
  assert.equal(await authorizeStaff(request('private-test')), true);
  assert.equal(await authorizeStaff(request('session')), true);
  role = { is_admin: true, is_banned: true };
  assert.equal(await authorizeStaff(request('session')), false);
  role = { is_editor: true };
  assert.equal(await authorizeStaff(request('session')), false);
  assert.equal(await authorizeStaff(request('session'), ['is_editor']), true);
  const failed = load('supabase/functions/_shared/authorization.ts', {
    Deno: { env: { get: key => env[key] } }, fetch: async () => new Response(null, { status: 401 }),
  });
  assert.equal(await failed.authorizeStaff(request('expired')), false);
});

test('privileged functions reject callers before provider or database work', async () => {
  for (const file of ['fetch-commodities', 'generate-thumbnail', 'send-notification']) {
    const handler = edge(`supabase/functions/${file}/index.ts`, env, {
      '../_shared/authorization.ts': { authorizeStaff: async () => false },
      'npm:@supabase/supabase-js@2': { createClient: () => { throw new Error('must not create privileged client'); } },
      'npm:@supabase/supabase-js@2.118.0': { createClient: () => { throw new Error('must not create privileged client'); } },
    });
    assert.equal((await handler(request())).status, 403, file);
  }
});

test('payments cannot report success, including fabricated amounts and test mode', async () => {
  const handler = edge('supabase/functions/process-payment/index.ts');
  const result = await handler(request('session', { tier: 'pinned', amount: 0, provider: 'test' }));
  assert.equal(result.status, 503);
  assert.equal((await result.json()).success, false);
});

test('phone verification rejects anonymous calls and missing SMS configuration', async () => {
  const client = {
    auth: { getUser: async () => ({ data: { user: { id: 'synthetic-user' } } }) },
    from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { is_banned: false } }) }) }) }),
  };
  const handler = edge('supabase/functions/send-phone-otp/index.ts', env, { 'npm:@supabase/supabase-js@2.118.0': { createClient: () => client } });
  assert.equal((await handler(request())).status, 401);
  const response = await handler(request('session', { action: 'send', phone: '+905550000001' }));
  assert.equal(response.status, 503);
  assert.equal((await response.json()).dev_code, undefined);
});

test('reCAPTCHA fails closed and checks action, hostname, score and age', async () => {
  const runtime = { RECAPTCHA_SECRET_KEY: 'synthetic-secret', NEXT_PUBLIC_SITE_URL: 'https://site.invalid' };
  let reply = { success: true, score: 0.9, action: 'signup', hostname: 'site.invalid', challenge_ts: new Date().toISOString() };
  const { POST } = load('app/api/recaptcha-verify/route.ts', {
    process: { env: runtime }, fetch: async () => Response.json(reply),
  });
  const body = { token: 'synthetic-token', action: 'signup' };
  assert.equal((await POST(request(null, body))).status, 200);
  for (const change of [{ action: 'login' }, { hostname: 'evil.invalid' }, { score: 0.1 }, { challenge_ts: '2000-01-01' }]) {
    const original = reply; reply = { ...reply, ...change };
    assert.equal((await POST(request(null, body))).status, 403);
    reply = original;
  }
  assert.equal((await POST(request(null, { ...body, token: 'no-key-dev-mode' }))).status, 400);
  delete runtime.RECAPTCHA_SECRET_KEY;
  assert.equal((await POST(request(null, body))).status, 503);
});

test('deployment checks reject placeholder URLs, service-role keys and enabled test accounts', () => {
  const settings = { NEXT_PUBLIC_SITE_URL: 'https://site.invalid', NEXT_PUBLIC_SUPABASE_URL: 'https://backend.invalid',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'sb_publishable_synthetic', NEXT_PUBLIC_APP_ENV: 'production',
    NEXT_PUBLIC_RECAPTCHA_SITE_KEY: 'synthetic-site', RECAPTCHA_SECRET_KEY: 'synthetic-secret' };
  assert.deepEqual(validateEnvironment(settings), []);
  for (const change of [{ NEXT_PUBLIC_SUPABASE_ANON_KEY: 'sb_secret_synthetic' }, { NEXT_PUBLIC_SITE_URL: 'https://yourdomain.com' },
    { DEV_TEST_ACCOUNTS_ENABLED: 'true' }, { NEXT_PUBLIC_SUPABASE_URL: 'https://backend.invalid/path' }, { RECAPTCHA_SECRET_KEY: '' }]) {
    assert.ok(validateEnvironment({ ...settings, ...change }).length);
  }
});


function notificationHarness(rows, { send = async () => new Response('{}'), patch, afterRead } = {}) {
  const deliveries = [];
  const keys = [];
  const matches = (status, filter) => !filter ||
    (filter.startsWith('eq.') && status === filter.slice(3)) ||
    (filter.startsWith('neq.') && status !== filter.slice(4)) ||
    (filter.startsWith('in.(') && filter.slice(4, -1).split(',').includes(status));
  const handler = edge('supabase/functions/send-notification/index.ts', { ...env, RESEND_API_KEY: 'synthetic' }, {
    '../_shared/authorization.ts': { authorizeStaff: async () => true },
  }, { fetch: async (input, options = {}) => {
    const url = new URL(input);
    if (url.origin === 'https://api.resend.com') {
      deliveries.push(JSON.parse(options.body).subject);
      keys.push(options.headers['Idempotency-Key']);
      return send();
    }
    assert.equal(url.origin, env.SUPABASE_URL);
    assert.equal(url.pathname, '/rest/v1/notifications');
    const id = url.searchParams.get('id')?.replace(/^eq\./, '');
    const selected = rows.filter(row => (!id || row.id === id) && matches(row.status, url.searchParams.get('status')));
    if (options.method === 'PATCH') {
      const data = JSON.parse(options.body);
      const override = patch?.(data);
      if (override) return override;
      for (const row of selected) Object.assign(row, data);
      return options.headers.Prefer === 'return=representation' ? Response.json(selected) : new Response(null, { status: 204 });
    }
    const snapshot = selected.slice(0, Number(url.searchParams.get('limit') || rows.length)).map(row => ({ ...row }));
    afterRead?.();
    return Response.json(snapshot);
  } });
  return { handler, deliveries, keys };
}
const notificationRow = (id, status) => ({ id, status, recipient_email: 'synthetic@example.invalid', subject: id, body: 'Synthetic notification' });
const deliveryResult = async (handler, body) => (await handler(request('admin', body))).json();

test('notification delivery batches pending rows and retries failed IDs without resending sent or uncertain rows', async () => {
  const pendingId = '10000000-0000-0000-0000-000000000001';
  const failedId = '10000000-0000-0000-0000-000000000002';
  const sentId = '10000000-0000-0000-0000-000000000003';
  const uncertainId = '10000000-0000-0000-0000-000000000004';
  const rows = [notificationRow(pendingId, 'pending'), notificationRow(failedId, 'failed'),
    notificationRow(sentId, 'sent'), notificationRow(uncertainId, 'uncertain')];
  let providerRejects = true;
  const { handler, deliveries, keys } = notificationHarness(rows, {
    send: async () => new Response(providerRejects ? 'Invalid recipient' : '{}', { status: providerRejects ? 400 : 200 }),
  });
  let result = await deliveryResult(handler, { batch: 20 });
  assert.equal(result.failed, 1);
  assert.deepEqual(deliveries, [pendingId]);
  assert.equal(rows[0].status, 'failed');
  providerRejects = false;
  for (const notificationId of [pendingId, failedId]) {
    result = await deliveryResult(handler, { notificationId });
    assert.equal(result.sent, 1);
    assert.equal(rows.find(row => row.id === notificationId).status, 'sent');
  }
  for (const notificationId of [sentId, uncertainId]) assert.equal((await deliveryResult(handler, { notificationId })).sent, 0);
  assert.deepEqual(deliveries, [pendingId, pendingId, failedId]);
  assert.deepEqual(keys, [`notification/${pendingId}`, `notification/${pendingId}`, `notification/${failedId}`]);
});

test('notification delivery preserves concurrent sent state during conflict, server-error and lost-response races', async () => {
  const id = '10000000-0000-0000-0000-000000000001';
  for (const outcome of ['conflict', 'server-error', 'lost-response']) {
    const rows = [notificationRow(id, 'pending')];
    const { handler } = notificationHarness(rows, { send: async () => {
      rows[0].status = 'sent'; // Another invocation completes after our reservation.
      if (outcome === 'lost-response') throw new Error('Synthetic connection loss');
      return new Response('Synthetic provider error', { status: outcome === 'conflict' ? 409 : 503 });
    } });
    assert.equal((await deliveryResult(handler, { notificationId: id })).failed, 1);
    assert.equal(rows[0].status, 'sent', outcome);
  }
});

test('notification delivery excludes uncertain provider or confirmation outcomes from all retries', async () => {
  const id = '10000000-0000-0000-0000-000000000001';
  for (const outcome of ['confirmation-error', 'confirmation-loss', 'provider-loss', 'server-error', 'timeout', 'conflict']) {
    const rows = [notificationRow(id, 'pending')];
    const { handler, deliveries } = notificationHarness(rows, {
      send: async () => {
        if (outcome === 'provider-loss') throw new Error('Synthetic lost provider response');
        return new Response('{}', { status: outcome === 'server-error' ? 503 : outcome === 'timeout' ? 408 : outcome === 'conflict' ? 409 : 200 });
      },
      patch: data => {
        if (data.status !== 'sent') return;
        if (outcome === 'confirmation-loss') throw new Error('Synthetic lost database response');
        if (outcome === 'confirmation-error') return new Response(null, { status: 503 });
      },
    });
    const result = await deliveryResult(handler, { batch: 20 });
    assert.equal(result.sent, 0);
    assert.equal(result.failed, 1);
    assert.equal(rows[0].status, 'uncertain', outcome);
    assert.equal((await deliveryResult(handler, { batch: 20 })).sent, 0);
    assert.equal((await deliveryResult(handler, { notificationId: id })).sent, 0);
    assert.equal(deliveries.length, 1, outcome);
  }
});

test('notification delivery requires a confirmed reservation and skips stale selected rows', async () => {
  const id = '10000000-0000-0000-0000-000000000001';
  for (const outcome of ['reservation-error', 'reservation-loss', 'stale-selection']) {
    const rows = [notificationRow(id, 'pending')];
    const { handler, deliveries } = notificationHarness(rows, {
      patch: data => {
        if (data.status !== 'uncertain') return;
        if (outcome === 'reservation-error') return new Response(null, { status: 503 });
        if (outcome === 'reservation-loss') { rows[0].status = 'uncertain'; throw new Error('Lost reservation response'); }
      },
      afterRead: () => { if (outcome === 'stale-selection') rows[0].status = 'sent'; },
    });
    assert.equal((await deliveryResult(handler, { batch: 20 })).sent, 0);
    assert.equal(deliveries.length, 0, outcome);
    assert.equal(rows[0].status, outcome === 'reservation-error' ? 'pending' : outcome === 'reservation-loss' ? 'uncertain' : 'sent');
  }
});
