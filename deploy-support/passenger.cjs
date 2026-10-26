// Passenger owns the listening socket. Do not use this launcher under systemd/Docker.
process.env.NODE_ENV = 'production';
const http = require('node:http');
const path = require('node:path');
const fs = require('node:fs');
const dir = __dirname;
const config = JSON.parse(fs.readFileSync(path.join(dir, '.next/required-server-files.json'), 'utf8')).config;
process.env.__NEXT_PRIVATE_STANDALONE_CONFIG = JSON.stringify(config);
const next = require('next');
const app = next({ dev: false, dir, conf: config });
const handle = app.getRequestHandler();
app.prepare().then(() => {
  http.createServer((req, res) => handle(req, res)).listen('passenger');
}).catch(() => { console.error('Application startup failed. Check the release files and runtime configuration.'); process.exit(1); });
