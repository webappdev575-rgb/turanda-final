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

test('weather accepts zero coordinates, ignores stale responses, and clears missing locations', async () => {
  const requests = [];
  let state;
  const { useWeather } = loadModule('hooks/use-weather.ts', {}, {
    fetch: (url, options) => {
      if (url.includes('nominatim')) return Promise.resolve(Response.json({}));
      return new Promise((resolve) => requests.push({ url, signal: options.signal, resolve }));
    },
  });
  function Capture({ lat, lng }) { state = useWeather(lat, lng); return null; }
  const root = createRoot(document.getElementById('root'));
  const render = (props) => act(async () => root.render(React.createElement(Capture, props)));
  try {
    await render({ lat: 0, lng: 0 });
    assert.equal(requests.length, 1);
    assert.match(requests[0].url, /latitude=0&longitude=0/);
    await render({ lat: 1, lng: 2 });
    assert.equal(requests[0].signal.aborted, true);
    await act(async () => requests[1].resolve(Response.json({ current: { temperature_2m: 25 } })));
    assert.equal(state.weather.current.temperature, 25);
    await act(async () => requests[0].resolve(Response.json({ current: { temperature_2m: 99 } })));
    assert.equal(state.weather.current.temperature, 25);
    await render({});
    assert.equal(state.weather, null);
    assert.equal(state.loading, false);
  } finally { await act(async () => root.unmount()); }
});
