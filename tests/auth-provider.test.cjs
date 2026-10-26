const { test } = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');
const React = require('react');
const { createRoot } = require('react-dom/client');
const { act } = require('react-dom/test-utils');
const { loadModule } = require('./load-module.cjs');

const dom = new JSDOM('<div id="root"></div>', { url: 'http://localhost' });
global.window = dom.window;
global.document = dom.window.document;
global.IS_REACT_ACT_ENVIRONMENT = true;
const tick = () => new Promise((resolve) => setTimeout(resolve, 5));

test('auth callbacks defer database requests and late profile responses cannot restore a signed-out user', async () => {
  let authCallback;
  let inCallback = false;
  let resolveProfile;
  let state;
  const client = {
    auth: {
      getSession: async () => ({ data: { session: null } }),
      onAuthStateChange: (callback) => { authCallback = callback; return { data: { subscription: { unsubscribe() {} } } }; },
    },
    from: () => {
      assert.equal(inCallback, false, 'database requests must wait for the auth callback to return');
      const query = { select: () => query, eq: () => query,
        maybeSingle: () => new Promise((resolve) => { resolveProfile = resolve; }) };
      return query;
    },
  };
  const { AuthProvider, useAuth } = loadModule('components/auth-provider.tsx', { '@/lib/supabase': { supabase: client, isSupabaseConfigured: true } });
  function Capture() { state = useAuth(); return null; }
  const root = createRoot(document.getElementById('root'));
  try {
    await act(async () => { root.render(React.createElement(AuthProvider, null, React.createElement(Capture))); await tick(); });
    await act(async () => {
      inCallback = true;
      authCallback('SIGNED_IN', { user: { id: 'first-user', app_metadata: {} } });
      inCallback = false;
      await tick();
    });
    assert.equal(state.user.id, 'first-user');
    assert.equal(typeof resolveProfile, 'function');
    await act(async () => { authCallback('SIGNED_OUT', null); await tick(); });
    await act(async () => { resolveProfile({ data: { id: 'first-user', is_admin: true }, error: null }); await tick(); });
    assert.equal(state.user, null);
    assert.equal(state.profile, null);
    assert.equal(state.loading, false);
  } finally { await act(async () => root.unmount()); }
});
