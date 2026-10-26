const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

// Run the actual TS modules with explicit local adapters for Deno and providers.
function loadModule(file, mocks = {}, globals = {}) {
  const absolute = path.resolve(__dirname, '..', file);
  const { outputText } = ts.transpileModule(fs.readFileSync(absolute, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true, jsx: ts.JsxEmit.ReactJSX },
    fileName: absolute,
  });
  const module = { exports: {} };
  const requireModule = (name) => {
    if (Object.hasOwn(mocks, name)) return mocks[name];
    if (name.startsWith('@/')) return loadModule(name.slice(2) + '.ts', mocks, globals);
    if (name.startsWith('.')) return loadModule(path.relative(path.resolve(__dirname, '..'), path.resolve(path.dirname(absolute), name)), mocks, globals);
    return require(name);
  };
  const context = { module, exports: module.exports, require: requireModule, console, Request, Response,
    URL, URLSearchParams, AbortSignal, AbortController, crypto: globalThis.crypto, TextEncoder, TextDecoder,
    setTimeout, clearTimeout, process, ...globals };
  vm.runInNewContext(outputText, context, { filename: absolute });
  return module.exports;
}

function edgeHandler(file, mocks, env = {}, globals = {}) {
  let handler;
  const Deno = { env: { get: (key) => env[key], toObject: () => ({ ...env }) }, serve: (callback) => { handler = callback; } };
  loadModule(`supabase/functions/${file}/index.ts`, mocks, { ...globals, Deno });
  return handler;
}

module.exports = { loadModule, edgeHandler };
