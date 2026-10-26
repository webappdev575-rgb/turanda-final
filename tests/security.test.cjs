const { test } = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');
const createDOMPurify = require('dompurify');
const { loadModule } = require('./load-module.cjs');

const dom = new JSDOM('');
const { window } = dom;
const svg = loadModule('lib/svg-sanitizer.ts', { dompurify: createDOMPurify(window) }, {
  window, DOMParser: window.DOMParser, XMLSerializer: window.XMLSerializer,
});

test('SVG keeps shapes and local gradients while removing executable markup', () => {
  const output = svg.sanitizeSvg(`<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"><defs><linearGradient id="g"><stop offset="0" stop-color="red"/></linearGradient></defs><path d="M0 0h10v10z" fill="url(#g)"/><script>alert(1)</script><foreignObject><div xmlns="http://www.w3.org/1999/xhtml">unsafe</div></foreignObject></svg>`);
  assert.match(output, /linearGradient/);
  assert.match(output, /url\(#g\)/);
  assert.doesNotMatch(output, /onload|script|foreignObject|unsafe/);
});

test('SVG strips unquoted events, encoded protocols, HTML and external references', () => {
  for (const payload of [
    '<svg><g onmouseover=alert(1) /></svg>',
    '<svg xmlns="http://www.w3.org/2000/svg"><a href="java&#x73;cript:alert(1)"><text>x</text></a></svg>',
    '<svg xmlns="http://www.w3.org/2000/svg"><image href="https://attacker.invalid/x"/><path fill="url(https://attacker.invalid/x)"/><use href="https://attacker.invalid/x"/></svg>',
    '<svg xmlns="http://www.w3.org/2000/svg"/><img src=x onerror=alert(1)>',
    '<svg xmlns="http://www.w3.org/2000/svg"><style>body{display:none}</style></svg>',
  ]) {
    const output = svg.sanitizeSvg(payload);
    assert.doesNotMatch(output, /onmouseover|onerror|javascript|attacker|<image|<img|<style|<a\b/);
    assert.equal(new window.DOMParser().parseFromString(output, 'image/svg+xml').querySelector('parsererror'), null);
  }
});

test('SVG validates the XML root and rejects malformed documents', () => {
  assert.equal(svg.isValidSvg('<svg xmlns="http://www.w3.org/2000/svg"><path/></svg>'), true);
  for (const input of ['', '<svg><path></svg>', '<div><svg/></div>', '<svg/><svg/>']) {
    assert.equal(svg.isValidSvg(input), false);
  }
});

test('auth redirects allow local routes and reject executable or external destinations', () => {
  const { safeRedirectPath } = loadModule('lib/navigation.ts');
  for (const input of ['javascript:alert(1)', '//attacker.invalid', '/\\attacker.invalid', 'https://attacker.invalid', '/\n/attacker.invalid', null]) {
    assert.equal(safeRedirectPath(input, '/jobs'), '/jobs');
  }
  assert.equal(safeRedirectPath('/messages?c=123#reply', '/jobs'), '/messages?c=123#reply');
});

test('notification HTML escapes user content without changing plain text subjects', async () => {
  let inserted;
  const client = { from: () => ({ insert: (row) => {
    inserted = row;
    return { select: () => ({ maybeSingle: async () => ({ data: null, error: null }) }) };
  } }) };
  const { createMessageNotification } = loadModule('lib/notifications.ts', { '@/lib/supabase': { supabase: client } });
  await createMessageNotification('recipient@example.test', 'Recipient', '<b>Sender</b>', '<img src=x>', '<script>x</script>', 'id" onclick="evil');
  assert.equal(inserted.subject, 'Yeni Mesaj: <b>Sender</b>');
  assert.doesNotMatch(inserted.body, /<img|<script|<b>Sender/);
  assert.match(inserted.body, /&lt;script&gt;/);
});
