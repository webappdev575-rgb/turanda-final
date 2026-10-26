# Turanda Tarım

Agricultural job marketplace for Turkey with Turkish, English, and Arabic support, commodity prices, news, maps, employer dashboards, and Supabase authentication/storage.

## Requirements

- Node.js **24** and npm **11** (`.nvmrc` and `package.json` specify the supported runtime).
- Supabase project with the repository migrations applied.
- Google reCAPTCHA v3 keys for the forms; Twilio configuration in Supabase for phone verification.

## Local setup

```bash
git clone https://github.com/webappdev575-rgb/turanda-final.git
cd turanda-final
npm ci
cp .env.example .env.local
# Fill in your staging project's settings.
npm run dev
```

Open http://localhost:3000. Use separate provider keys and a staging Supabase project for development. Credentials for privileged services belong in Supabase secrets, not browser configuration. Test-account seeding requires explicit `DEV_TEST_ACCOUNTS_ENABLED=true` and refuses production environments.

## Validate and deploy

```bash
npm run typecheck
npm run lint
npm run test:security
npm audit
npm run deploy:package
```

The deploy command creates `deploy/turanda.tar.gz`, including the standalone server, runtime dependencies, public assets, and Next.js static assets. `.env*` and private key files are excluded. Rebuild after changing `NEXT_PUBLIC_*` values.

- [Step-by-step hosting guide](DEPLOYMENT_GUIDE.md): HostPapa plan requirements, Supabase setup, cPanel/Passenger, VPS/nginx, Docker, SSL, updates, and rollback.
- [Security audit](SECURITY_AUDIT.md): findings, fixes, intentional behavior changes, and remaining launch checks.
- [Architecture](ARCHITECTURE.md): feature and source-file map.

**Hosting:** this is a Next.js 15 Node application. PHP-only shared hosting cannot run the current app. Confirm Node.js 24 support for your exact hosting plan. Supabase remains the backend.

**Access:** employers manage their own jobs and applicants. Existing ownerless jobs need verified admin assignment after the ownership migration. Public job browsing stays available.

**Payments:** online checkout is unavailable until a complete provider confirmation/webhook integration exists. Free job posting remains available. Missing verification providers return errors instead of simulated success. Automatic email outbox creation also needs a trusted server-side workflow.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Development server on port 3000 |
| `npm run build` | Production standalone build |
| `npm start` | Standard Next.js production server from a full checkout |
| `npm run check:env` | Check production configuration without printing values |
| `npm run deploy:package` | Validate config, build, and assemble an upload archive |
| `node deploy/turanda/server.js` | Run the assembled standalone server |
| `npm run test:security` | Security regression checks with synthetic fixtures |
| `npm run seed:test-accounts` | Explicit development-only account seed |

For Docker, see the guide; it supplies browser configuration at build time and server secrets at runtime. For Netlify, the existing `netlify.toml` declares its Next.js build plugin. Vercel can import the repository directly. Configure public environment settings before building on either provider.

© 2026 Turanda Tarım. All rights reserved.
