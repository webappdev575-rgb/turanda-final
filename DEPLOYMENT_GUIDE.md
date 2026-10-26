# Deploy Turanda on HostPapa or another web server

## 1. Choose a compatible hosting plan

Turanda uses **Next.js 15, Node.js 24, and an external Supabase project**. It has a server API, authentication callbacks, and dynamic news/course routes. The deployment output is a Node application, not an HTML-only `dist` folder.

| Hosting capability | Deployment route |
| --- | --- |
| Shared hosting with only PHP/Apache and file uploads | Incompatible with the current application. Use a Node-capable plan or host the app elsewhere and point your domain there. |
| cPanel with Node.js 24 and Passenger enabled | Follow section 6 after support confirms support for custom Next.js applications. |
| VPS with Node.js 24 and a persistent process/reverse proxy | Follow section 7. This is the most predictable self-hosting route. |
| Docker-capable server | Follow section 8. |

**Before buying or changing a HostPapa plan**, ask support:

> Can this exact plan run a persistent Next.js 15 application with Node.js 24? Is it managed through Passenger or a normal TCP port? Can I set environment variables and use SSH/SFTP? Can it connect over HTTPS/WebSockets to Supabase and Google reCAPTCHA? What memory/process limits apply?

HostPapa's knowledge-base page returned an automated-access challenge during this audit on 2026-10-26. Plan-specific Node.js availability and Passenger configuration could not be verified. A cPanel login alone does not establish Node.js support. See [HostPapa support](https://www.hostpapa.com/knowledgebase/) and [Next.js self-hosting documentation](https://nextjs.org/docs/app/guides/self-hosting).

## 2. Prepare Supabase first

Keep database/Auth/Storage/Edge Functions on Supabase. You do not need a MySQL database on the web host.

1. Back up the existing database and Storage, and first test the release against a staging Supabase project.
2. Compare the deployed migration history with `supabase/migrations/`. Apply only missing migrations in timestamp order using the Supabase CLI or SQL editor. Do not replay historical seed/cron migrations into an existing project.
3. Apply both new migrations, in order:
   - `20261026200000_harden_privileged_fields_and_phone_verification.sql`
   - `20261026201000_restrict_jobs_and_applications_to_owners.sql`
4. The second migration intentionally replaces the former shared access model. Public browsing stays available; employers can manage only their jobs, applicants can read their own applications, and the job owner/admin can review applications. Normal employers can change application status, not applicant identity/content.
5. **Assign owners to existing jobs.** These stay publicly listed but are initially manageable only by admins. In the SQL editor, inspect unassigned rows:

   ```sql
   SELECT id, title, farm_name FROM public.jobs WHERE employer_id IS NULL;
   ```

   After independently verifying each employer, assign specific IDs, never all jobs to one user:

   ```sql
   -- Replace both UUIDs with verified records. Run from the trusted SQL editor.
   BEGIN;
   SET LOCAL request.jwt.claim.role = 'service_role';
   UPDATE public.jobs
   SET employer_id = 'VERIFIED-EMPLOYER-USER-UUID'::uuid
   WHERE id = 'SPECIFIC-JOB-UUID'::uuid AND employer_id IS NULL;
   COMMIT;
   ```

   Verify the affected row and its associated applications. Do not infer ownership from a farm name or from legacy conversation records. Historical conversations and legacy applications with no `applicant_id` need a separate data review; the new migration does not invent missing identities or rewrite past messages.
6. Deploy the changed Edge Functions together with their shared authorization module:

   ```bash
   supabase login
   supabase link --project-ref YOUR_PROJECT_REF
   supabase functions deploy fetch-news
   supabase functions deploy fetch-commodities
   supabase functions deploy generate-thumbnail
   supabase functions deploy send-notification
   supabase functions deploy send-phone-otp
   supabase functions deploy process-payment
   supabase functions deploy admin-user-action
   ```

   These commands require your Supabase CLI and account access. Preserve `supabase/config.toml`; functions with gateway JWT checks disabled validate their callers in code. Never add a service-role key to browser code.
7. Configure `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, and `TWILIO_FROM_NUMBER` in **Supabase Edge Function secrets**. Phone verification now requires real delivery and authenticated callers; no development code is returned or logged. Apply the migration before switching the phone function.
8. Optional AI/Resend credentials also belong in Supabase secrets. Notification delivery is limited to admins/service-role schedulers and pending rows. Normal browser users cannot write the notification outbox under the existing RLS policies; automatic application/message email generation needs a trusted server-side workflow before enabling it. In-app jobs/messages remain separate from email delivery.
9. Set Supabase Auth **Site URL** to `https://YOUR_DOMAIN` and allow `https://YOUR_DOMAIN/auth/callback` as a redirect URL. Configure production SMTP, email confirmation, rate limits, and recovery emails in Supabase.
10. For Google OAuth, the authorized redirect URI in Google Cloud is **Supabase's provider callback**: `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback` (or the callback shown by Supabase). The application callback `/auth/callback` belongs in Supabase's allowed redirect list. Keep the Google client secret in the provider settings.

A fresh Supabase installation also needs the existing migrations, buckets, and configured ingestion/Vault secrets. Historical cron migrations use `pg_cron`, `pg_net`, and Vault: inspect them for project-specific values before enabling scheduled work. This audit tested the new database changes on disposable PostgreSQL, not a full production database restore.

## 3. Configure build and runtime settings

On your build computer or CI runner, use Node.js 24 and npm 11:

```bash
node --version
npm --version
npm ci
cp .env.example .env.local
```

Edit `.env.local`:

```dotenv
NEXT_PUBLIC_SITE_URL=https://YOUR_DOMAIN
NEXT_PUBLIC_APP_ENV=production
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_PUBLIC_ANON_OR_PUBLISHABLE_KEY
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=YOUR_RECAPTCHA_V3_SITE_KEY
RECAPTCHA_SECRET_KEY=YOUR_RECAPTCHA_V3_SECRET
DEV_TEST_ACCOUNTS_ENABLED=false
# Optional Google Search Console HTML verification content:
NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=
```

Register the live hostname in your Google reCAPTCHA v3 settings. Use separate keys for staging. Never use the Supabase service-role/secret key as the public key.

**Build-time:** all `NEXT_PUBLIC_*` values are embedded into browser bundles. Changing them in cPanel after uploading an existing build does not update the browser; rebuild and redeploy.

**Runtime:** set `RECAPTCHA_SECRET_KEY` in the hosting panel or private service environment. The reCAPTCHA hostname check uses `NEXT_PUBLIC_SITE_URL` embedded during the build, including in the server route. Setting it only at runtime does not change that check: rebuild when changing domains, and redirect alternate hostnames to the built canonical hostname. The frontend host does not need a Supabase service-role key, database password, SMS, payment, or email credentials.

The reCAPTCHA UI check is supplementary. Supabase's direct Auth/Data APIs remain reachable by clients; configure their own native bot protection/rate limits and RLS. A successful browser check is not a server authorization credential.

## 4. Validate and create the upload package

From the repository root:

```bash
npm run typecheck
npm run lint
npm run test:security
npm audit
npm run deploy:package
```

`deploy:package` checks configuration, builds the production app, and creates:

```text
deploy/turanda.tar.gz          # upload this archive
deploy/turanda/
  server.js                   # regular Node server entry point
  passenger.cjs               # Passenger-only launcher
  package.json
  node_modules/               # traced runtime dependencies
  .next/                      # server files + browser static files
  public/
  release.json
```

The packager excludes `.env*`, `.pem`, and `.key` files from the traced runtime. Treat the archive as private application code; do not put the archive or environment files in `public_html`.

Build on **Linux with the same Node major version** as the target. If the host's architecture, libc, or native modules differ, build on a compatible machine or on that server. The standalone bundle includes its dependencies; **do not run `npm ci` inside this assembled package**.

For an optional database regression check, `tests/security-database.sql` creates a destructive fixture. Run it only in a new disposable PostgreSQL database, never your application database.

## 5. Upload safely

1. Use SFTP or the hosting file manager.
2. Create a private release directory, for example `/home/ACCOUNT/apps/turanda/releases/RELEASE_ID`.
3. Upload and extract `turanda.tar.gz` there with hidden files included.
4. Confirm `.next/static`, `.next/server`, `public`, and `node_modules` exist.
5. Set private environment values through the panel/service configuration, not a browser-accessible file.
6. Keep the previous release until the replacement passes the smoke checks.

## 6. cPanel / Passenger route (only if the plan supports it)

1. In cPanel, open the host's Node.js application tool. If it is absent, ask support about your exact plan; uploading an `.htaccess` file cannot add a Node runtime.
2. Select **Node.js 24**, production mode, your HTTPS application URL, and a private application root containing the extracted package.
3. For **Passenger**, set the startup file to **`passenger.cjs`**. It listens on Passenger's special socket. Ask support to confirm `.cjs` startup-file support. If the panel only offers `.js`, rename this file to `passenger.js` in the uploaded package, whose generated package has no `type: module` setting, and use that filename.
4. For a manager that supervises a normal TCP server instead, use **`server.js`**, the panel's assigned `PORT`, and `HOSTNAME=0.0.0.0`.
5. Set the runtime variables from section 3. Passenger owns its socket; do not give it a hard-coded TCP-port rewrite.
6. Save/restart the application and check its error log.
7. Enable the host's SSL certificate and force HTTPS. Have the host's application manager configure the domain/reverse proxy.
8. Run section 9's smoke checks, including nested-route refresh and `/api/health`.

The Passenger launcher has a local socket smoke test, but this task has no access to an actual HostPapa Passenger installation. Host-level routing, Node selection, process limits, and SSL must be checked on your account. Do not add an SPA `/index.html` fallback or copy only `public/` into the web root.

## 7. VPS route with systemd and nginx

The following example is for **Ubuntu with systemd**. Install Node.js 24/npm 11 using your approved distribution method, plus nginx and an SSL certificate tool. On other operating systems, use their equivalent service/package commands.

1. Create an application user and directories:

   ```bash
   sudo useradd --system --create-home --shell /usr/sbin/nologin turanda
   sudo mkdir -p /srv/turanda/releases/RELEASE_ID
   sudo tar -xzf turanda.tar.gz -C /srv/turanda/releases/RELEASE_ID
   sudo chown -R turanda:turanda /srv/turanda
   sudo ln -s /srv/turanda/releases/RELEASE_ID /srv/turanda/current
   ```

2. Create `/etc/turanda.env` owned by root with mode `600`:

   ```dotenv
   RECAPTCHA_SECRET_KEY=YOUR_SERVER_SECRET
   ```

3. Create `/etc/systemd/system/turanda.service` (adjust the Node path to your installation):

   ```ini
   [Unit]
   Description=Turanda Next.js application
   After=network.target

   [Service]
   User=turanda
   Group=turanda
   WorkingDirectory=/srv/turanda/current
   Environment=NODE_ENV=production
   Environment=HOSTNAME=127.0.0.1
   Environment=PORT=3000
   EnvironmentFile=/etc/turanda.env
   ExecStart=/usr/bin/node /srv/turanda/current/server.js
   Restart=on-failure
   RestartSec=5
   NoNewPrivileges=true
   PrivateTmp=true

   [Install]
   WantedBy=multi-user.target
   ```

4. Start it and verify local readiness:

   ```bash
   sudo systemctl daemon-reload
   sudo systemctl enable --now turanda
   curl --fail http://127.0.0.1:3000/api/health
   sudo journalctl -u turanda -n 50 --no-pager
   ```

5. Create an nginx site, replacing `YOUR_DOMAIN`:

   ```nginx
   server {
     listen 80;
     server_name YOUR_DOMAIN;
     client_max_body_size 2m;
     location / {
       proxy_pass http://127.0.0.1:3000;
       proxy_http_version 1.1;
       proxy_set_header Host $host;
       proxy_set_header X-Forwarded-Host $host;
       proxy_set_header X-Forwarded-Proto $scheme;
       proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
       proxy_buffering off;
       proxy_read_timeout 60s;
     }
   }
   ```

   Enable that site using your distribution's nginx layout, then run `sudo nginx -t` and reload nginx. No Supabase WebSocket proxy is needed here: browsers connect directly to Supabase.

6. Point the domain's DNS records to the VPS. Provision a certificate for that hostname, enable the HTTP-to-HTTPS redirect, and allow only SSH/HTTP/HTTPS through the server firewall. Keep Node port 3000 private. Add HSTS only after HTTPS and the chosen domain work reliably.
7. Run section 9. `/api/health` is liveness only; it does not verify Supabase/provider readiness.

## 8. Docker route

Use the full checkout on a Docker-capable server. Create a private `.env` from `.env.example` with the real settings. Compose loads `.env` for interpolation:

```bash
npm ci
node --env-file=.env scripts/check-env.mjs
docker compose config --quiet
docker compose up -d --build
curl --fail http://127.0.0.1:3000/api/health
docker compose logs --tail=50 web
```

Public configuration is supplied as **build arguments**. The reCAPTCHA secret is supplied only at runtime. The container runs as a non-root user and binds the host port to loopback. Put nginx/Caddy or the hosting reverse proxy in front of it and terminate TLS there. Rebuild after changing public settings.

Docker support is included as an alternative; container-engine availability and production TLS still depend on the host. If your proxy runs in another container, configure a private shared Docker network rather than exposing the Node port publicly.

## 9. Launch smoke checks

1. `https://YOUR_DOMAIN/api/health` returns `{"status":"ok"}` and `Cache-Control: no-store`.
2. Home, `/jobs`, `/haberler`, `/login`, `/signup`, and a real nested news/course URL load; refreshing nested routes works.
3. CSS, JavaScript, fonts, and logo files load. No browser errors or mixed-content warnings.
4. Sign-up, confirmation/recovery email, Google OAuth, login, and logout work with production provider settings.
5. SMS delivery and verification work; missing SMS configuration returns an error, never a code.
6. Employer A creates a free job. Employer B cannot edit/delete it or read its applicants, even via a direct Supabase request.
7. An applicant can submit/read their application; the owner can accept/reject it. Unrelated accounts cannot read CV text or applicant contacts.
8. Admin management and explicitly assigned legacy jobs work. A normal user cannot set role flags, verification flags, paid status, or featured status.
9. Online payments show the unavailable/contact message and never grant a paid listing. Live checkout requires a separate implementation with provider tokenization, server-owned pricing, and verified webhooks.
10. Unauthorized notification, thumbnail, and commodity-ingestion requests fail. Re-enable cron only with authenticated, least-privilege scheduling.
11. Check `/robots.txt`, `/sitemap.xml`, canonical URLs, and optional Search Console verification against your real domain.

## 10. Updates, rollback, and common problems

For each update: pull the intended release, `npm ci`, validate, rebuild with that environment's public values, upload into a **new** release directory, switch the active directory/symlink, restart, then smoke test. Keep old hashed assets available during a rolling deployment or expect open browser tabs to need a refresh.

On the VPS example, switch the symlink to the previous release and restart `turanda` to roll back application code. Database migrations are separate: keep the security/ownership migrations applied and do not restore permissive policies to roll back a UI change. Review database compatibility before switching versions.

| Symptom | Check |
| --- | --- |
| PHP page / directory listing / source displayed | Domain is serving files instead of the Node application. Fix the host's application routing. |
| 502/503 | Node version, process log, startup file, assigned port/socket, and available RAM. |
| CSS/JS 404 | Upload the complete assembled package, including hidden `.next/static`. |
| Login works locally but fails live | Rebuild with correct public values; check reCAPTCHA hostname, server secret, Supabase Site URL/redirect allowlist. |
| Owner sees no old jobs | Admin must verify and assign the old `employer_id` values. |
| SMS 503 | Configure Twilio secrets in Supabase and deploy both new SQL and the phone function. |
| Missing payment/email success | Payments are intentionally unavailable; automatic email generation requires a trusted server workflow. |
| Local build runs out of memory | Build on a compatible Linux CI runner or larger machine; upload the standalone package. |

Keep database backups, restore procedures, dependency monitoring, and host logs under your normal operations process. Read `SECURITY_AUDIT.md` for the audit's tested scope and remaining limitations.
