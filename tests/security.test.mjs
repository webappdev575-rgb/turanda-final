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
function edge(file, env = {}, imports = {}) {
  let handler;
  load(file, { Deno: { env: { get: key => env[key] }, serve: value => { handler = value; } } }, imports);
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
