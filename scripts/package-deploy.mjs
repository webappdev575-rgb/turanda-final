import { cp, mkdir, rm, access, readFile, writeFile } from 'node:fs/promises';
import { resolve, basename } from 'node:path';
import { execFileSync } from 'node:child_process';

const root = process.cwd();
const target = resolve(root, 'deploy/turanda');
await access(resolve(root, '.next/standalone/server.js'));
await rm(target, { recursive: true, force: true });
await mkdir(target, { recursive: true });
const safe = source => !basename(source).startsWith('.env') && !/\.(pem|key)$/i.test(source);
await cp(resolve(root, '.next/standalone'), target, { recursive: true, filter: safe });
await cp(resolve(root, '.next/static'), resolve(target, '.next/static'), { recursive: true });
await cp(resolve(root, 'public'), resolve(target, 'public'), { recursive: true });
await cp(resolve(root, 'deploy-support/passenger.cjs'), resolve(target, 'passenger.cjs'));
const revision = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
const pkg = JSON.parse(await readFile(resolve(root, 'package.json'), 'utf8'));
await writeFile(resolve(target, 'release.json'), JSON.stringify({
  revision, builtAt: new Date().toISOString(), node: process.version, next: pkg.dependencies.next,
  note: 'Built from the current working tree. Public configuration is fixed at build time.',
}, null, 2) + '\n');
// Package only the assembled application. Real .env files and source secrets are excluded.
execFileSync('tar', ['-czf', resolve(root, 'deploy/turanda.tar.gz'), '-C', target, '.'], { stdio: 'inherit' });
console.log('Created deploy/turanda/ and deploy/turanda.tar.gz. Start with: node server.js');
