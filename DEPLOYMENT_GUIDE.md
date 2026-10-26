# Turanda Production Deployment Guide

This guide deploys the current Next.js standalone application to a Node.js-capable cPanel host such as Bluehost. It assumes that the Supabase project already exists and that the domain uses HTTPS.

## 1. Deployment model

This application is not a static `/dist` export. The production build creates:

- `.next/standalone/server.js` — the Node.js application startup file.
- `.next/standalone/` — the standalone runtime and required server dependencies.
- `.next/static/` — browser bundles and static build assets.
- `public/` — public files, if present.

The recommended cPanel application root contains the contents of `.next/standalone/`, plus `.next/static/` at `.next/static/` and `public/` at `public/`.

The runtime uses Node.js 18 or newer and listens on the port supplied by the hosting panel. The generated server uses `HOSTNAME=0.0.0.0` and should not be exposed directly to the public internet without the host's reverse proxy.

## 2. Required environment variables

Copy `.env.example` into the hosting environment and provide real values through cPanel's Node.js Application Manager or the host's environment-variable interface. Never commit the real `.env` file or paste secret values into this document.

| Variable | Required | Exposure | Purpose |
|---|---:|---|---|
| `NEXT_PUBLIC_SITE_URL` | Yes | Browser-safe | Canonical HTTPS site URL used for links and callback configuration. |
| `NEXT_PUBLIC_APP_ENV` | Yes | Browser-safe | Set to `production` for the live site. |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Browser-safe | Supabase project URL used by the browser client. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Browser-safe | Supabase public anon key. RLS must protect all data. |
| `SUPABASE_SERVICE_ROLE_KEY` | No | Server-only | Required by the development seed script and privileged server operations. Never expose it to the browser. |
| `SUPABASE_DB_URL` | No | Server-only | Direct database connection string for approved server operations. Do not place it in client code. |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | If Google OAuth is enabled | Browser-safe | Google OAuth client identifier. Configure the provider in Supabase Auth. |
| `GOOGLE_CLIENT_SECRET` | If Google OAuth is enabled | Server/provider-only | Google OAuth provider secret. Keep it in Supabase/provider settings. |
| `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` | Recommended | Browser-safe | reCAPTCHA v3 site key. |
| `RECAPTCHA_SECRET_KEY` | Recommended | Server-only | Server verification key used by `app/api/recaptcha-verify/route.ts`. |
| `WEATHER_API_KEY` | Optional | Server/provider-only | Weather provider credential. |
| `TMEX_API_KEY` | Optional | Server/provider-only | Commodity source credential. |
| `COMMODITY_API_KEY` | Optional | Server/provider-only | Custom commodity source credential. |
| `NEWS_API_KEY` | Optional | Server/provider-only | News source credential. |
| `AI_IMAGE_API_KEY` | Optional | Edge Function-only | AI thumbnail provider credential. |
| `AI_IMAGE_PROVIDER` | Optional | Server-only | `openai`, `stability`, or `custom`. |
| `AI_IMAGE_ENDPOINT` | Optional | Server-only | Custom thumbnail endpoint when applicable. |
| `EMAIL_PROVIDER` | Optional | Server-only | Use `mock` during development; the current auth email service is Supabase. |
| `SMTP_HOST` | Optional | Server-only | Future/custom SMTP host. |
| `SMTP_PORT` | Optional | Server-only | SMTP port, normally `587` or `465`. |
| `SMTP_USER` | Optional | Server-only | SMTP account name. |
| `SMTP_PASSWORD` | Optional | Server-only | SMTP password. |
| `SMTP_FROM` | Optional | Server-only | Approved sender address. |
| `PHONE_VERIFICATION_PROVIDER` | Optional | Server-only | Use `mock` in development; the current phone OTP service is Supabase Auth. |
| `TWILIO_ACCOUNT_SID` | Optional | Server-only | Future Twilio account identifier. |
| `TWILIO_AUTH_TOKEN` | Optional | Server-only | Future Twilio secret. |
| `TWILIO_FROM_NUMBER` | Optional | Server-only | Future Twilio sender number. |
| `DEV_TEST_ACCOUNTS_ENABLED` | No | Server/build setting | Set to `false` in production. It controls the dev account page. |
| `CRON_SECRET` | If cron is enabled | Server-only | Secret for authenticating scheduled requests. |
| `IYZICO_API_KEY` | If payments are enabled | Edge Function-only | Payment provider key read by `process-payment`. |
| `IYZICO_SECRET_KEY` | If payments are enabled | Edge Function-only | Payment provider secret read by `process-payment`. |

Supabase's standard variables are already used by the Edge Functions: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY`. Keep the server-side names available to the Edge Function environment even if the Next.js app uses the `NEXT_PUBLIC_` browser names.

## 3. Local verification before upload

Use Node.js 18 or newer and install the lockfile exactly:

```bash
npm ci
npm run typecheck
npm run build
```

The build output is `.next`, not `dist`. For the cPanel runtime, use the standalone bundle:

```bash
rm -rf .next/standalone/.next/static
mkdir -p .next/standalone/.next
cp -R .next/static .next/standalone/.next/static
cp -R public .next/standalone/public
```

If `public/` does not exist in a specific checkout, omit that copy command. The startup file after this step is `.next/standalone/server.js`.

## 4. Seed the development test accounts

The seed script uses the Supabase service role and must only run from a trusted terminal. It creates or updates these accounts:

| Account | Password | Profile state | Test destination |
|---|---|---|---|
| `admin@example.com` | `Password123!` | `is_admin=true`, onboarded, verified | `/admin/dashboard` |
| `user@example.com` | `Password123!` | Standard worker, onboarded, verified | `/dashboard` |
| `pending@example.com` | `Password123!` | Not onboarded, not phone verified, not verified | `/onboarding` |

Run it only in a development or staging Supabase project:

```bash
npm run seed:test-accounts
```

The script requires `SUPABASE_URL` or `NEXT_PUBLIC_SUPABASE_URL`, plus `SUPABASE_SERVICE_ROLE_KEY`. It is not a web route and must never be called from a browser. Remove or rotate these accounts before production launch. The `/dev` page is disabled when `NODE_ENV=production` or `DEV_TEST_ACCOUNTS_ENABLED=false`.

## 5. Create the Node.js application in cPanel

The exact labels vary by Bluehost plan, but the setup sequence is:

1. Open cPanel and find **Software > Setup Node.js App** or **Node.js Application Manager**.
2. Create a new application using Node.js 18 or newer.
3. Set **Application mode** to `Production`.
4. Set **Application root** to a private directory such as `turanda-app` or the directory supplied by your host. Do not use a directory containing unrelated websites.
5. Set **Application URL** to the HTTPS domain or subdomain that should serve Turanda.
6. Set **Application startup file** to `server.js`.
7. Set the application environment variables from the table above.
8. Save the application, then note the port assigned by cPanel. Do not hard-code that port in the app; cPanel supplies it at runtime.

Upload either through SFTP/FTP or cPanel File Manager. The final application root should resemble:

```text
application-root/
  server.js
  package.json
  .next/
    static/
  public/
```

The standalone server normally includes its own production `node_modules` tree. If the host requires a dependency install, upload the full project and run:

```bash
npm ci --omit=dev
npm run build
```

For a source-based cPanel setup, the application startup file can remain `server.js` and the app can be started by the Node.js Application Manager. For the standalone setup, `server.js` is the generated file from `.next/standalone/`.

After saving the application, use the cPanel **Restart** button. Check the application log before testing the domain.

## 6. Domain, OAuth, and Supabase settings

Before opening the login page in production:

1. Add the production site URL to the Supabase Auth URL configuration.
2. Add the exact callback URL ending in `/auth/callback` to the Supabase Google provider configuration.
3. Add the same callback URL to the Google Cloud OAuth client configuration.
4. Confirm the production site uses HTTPS.
5. Confirm email confirmation and SMS settings match the intended production onboarding policy.
6. Verify that the Supabase tables used by the application have RLS enabled and the expected policies.
7. Confirm payment and notification Edge Functions are deployed and their secrets are present.

The application callback code is `app/auth/callback/page.tsx`; it sends users to `/onboarding` until their profile and phone verification are complete, otherwise it sends them to `/dashboard`.

## 7. Cron jobs and scheduled tasks

There is currently no `/api/cron/*` route or Node.js worker in this repository. Do not configure a cron job against a route that does not exist.

When a protected scheduler route is added, use a command like this in cPanel Cron Jobs:

```bash
curl --fail --silent --show-error --max-time 60 \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  https://yourdomain.com/api/cron/fetch-news >/dev/null
```

For a local Node worker uploaded to the account, the syntax would be:

```bash
/usr/local/bin/node /home/CPANEL_USERNAME/turanda-app/jobs/fetch-news.mjs
```

Replace the placeholder domain, secret, username, path, and Node binary with values supplied by the hosting account. Do not place `CRON_SECRET` in the URL, HTML, JavaScript, or a public repository. Use separate cron secrets for staging and production.

The existing data-ingestion functions are `supabase/functions/fetch-news/index.ts` and `supabase/functions/fetch-commodities/index.ts`. If cPanel calls them directly, protect the entry point with a secret-aware wrapper or a scheduler that supports authenticated Edge Function requests; they are not a substitute for an authenticated cron route by themselves.

## 8. Apache reverse proxy and `.htaccess`

Many cPanel Node.js applications are already reverse-proxied by the Node.js Application Manager. In that case, do not add a second proxy rule; configure the application URL and startup file in the manager and let the host-generated Apache configuration route traffic to the assigned port.

If Bluehost confirms that Apache proxy modules are enabled for the account and gives the Node.js process a fixed local port, the following `.htaccess` pattern can be used in the domain document root. Replace `3000` with the assigned local port:

```apache
RewriteEngine On

# Keep Apache from serving an old static copy of Next output.
RewriteCond %{REQUEST_FILENAME} -f [OR]
RewriteCond %{REQUEST_FILENAME} -d
RewriteRule ^ - [L]

# Forward every Next.js route, asset, and API request to Node.
RewriteRule ^(.*)$ http://127.0.0.1:3000/$1 [P,L]

# Preserve the original host and protocol when proxy modules support these headers.
RequestHeader set X-Forwarded-Proto "https"
RequestHeader set X-Forwarded-Host "%{HTTP_HOST}"
```

A more conservative variant, when the host already serves `.next/static` and `public` directly, is:

```apache
RewriteEngine On

RewriteRule ^_next/static/(.*)$ http://127.0.0.1:3000/_next/static/$1 [P,L]
RewriteRule ^(.*)$ http://127.0.0.1:3000/$1 [P,L]
```

These rules require `mod_proxy`, `mod_proxy_http`, and permission for proxying. If Apache returns a 500 error or the host blocks `[P]`, remove the custom proxy rules and use the Node.js Application Manager's generated proxy configuration. Do not use a static SPA fallback such as `RewriteRule ^ /index.html`; this is a server-rendered Next.js application and that rule can break route handlers and authentication callbacks.

## 9. Health checks and smoke tests

After restart, test the following user paths in order:

1. Homepage `/` loads without a server error.
2. `/login` displays email/password and Google sign-in controls.
3. Standard user can sign in and reach `/dashboard`.
4. Pending user is routed to `/onboarding`.
5. Admin reaches `/admin/dashboard`; standard users cannot access it.
6. `/jobs`, `/commodities`, `/haberler`, `/messages`, and `/advertise` load their empty and populated states.
7. Google OAuth returns to `/auth/callback` and then to the correct destination.
8. Phone OTP sends and verifies through the configured Supabase Auth provider.
9. Notification and payment Edge Functions return CORS headers and reject unauthorized calls.
10. Refreshing a nested route does not produce an Apache 404.

## 10. Production security checklist

- Set `DEV_TEST_ACCOUNTS_ENABLED=false`.
- Remove or disable all three test accounts.
- Rotate any password used during testing.
- Never upload `.env` to a public directory.
- Keep `SUPABASE_SERVICE_ROLE_KEY`, SMTP, SMS, AI, payment, and cron secrets server-side.
- Verify RLS and Edge Function JWT settings in Supabase before launch.
- Confirm database backups and a recovery process.
- Enable HTTPS and redirect HTTP to HTTPS at the host level.
- Restrict cron jobs to the smallest required schedule.
- Review application logs for leaked secrets or raw provider errors.
- Re-run `npm run typecheck` and `npm run build` after every deployment configuration change.

## 11. File ownership map

For the full feature map, see `ARCHITECTURE.md`. The deployment-critical files are:

- `next.config.js` — standalone output and build configuration.
- `Dockerfile` — reference production container using `.next/standalone/server.js`.
- `package.json` — build, start, typecheck, and test-account seed commands.
- `.env.example` — documented configuration contract.
- `scripts/seed-test-accounts.mjs` — server-only development account setup.
- `app/dev/page.tsx` and `components/dev/dev-account-switcher.tsx` — development-only testing UI.
- `supabase/config.toml` — Edge Function JWT and entrypoint configuration.
- `supabase/functions/*/index.ts` — server-side integrations and privileged operations.

## 12. SEO launch configuration (HostPapa)

### 12.1 Placeholders to fill in before going live

The following files contain a placeholder domain and a placeholder Google
Search Console code. Replace both after the domain is connected:

- `app/layout.tsx` — `SITE_URL` (currently `https://www.turanda.com`) and
  `GSC_VERIFICATION` (currently `google-search-console-verification-code-here`).
- `app/sitemap.ts` — `SITE_URL`.
- `app/robots.ts` — `SITE_URL`.

### 12.2 Google Search Console

1. Add the domain property in Google Search Console.
2. Choose the "HTML tag" verification method and copy the `content` value.
3. Paste it into `GSC_VERIFICATION` in `app/layout.tsx`, rebuild, and deploy.
4. Submit `https://YOUR-DOMAIN/sitemap.xml` in Search Console → Sitemaps.

### 12.3 Enforce HTTPS on HostPapa (cPanel)

1. In cPanel, open **SSL/TLS Status** and run "AutoSSL" for the domain so a
   free Let's Encrypt certificate is installed.
2. Enable **Force HTTPS Redirect** in cPanel → **Domains** (toggle next to
   the domain), or add the following to the domain's `.htaccess` above any
   proxy rules:

```apache
RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
```

3. Confirm `https://YOUR-DOMAIN` and the `www`/non-`www` variant both resolve
   to the same canonical host and never serve mixed-content warnings.

### 12.4 SEO surfaces shipped with the app

- `app/sitemap.ts` → `/sitemap.xml` (all public routes, static).
- `app/robots.ts` → `/robots.txt` (allows crawling, blocks admin/dev/private
  routes, points to the sitemap).
- `public/llms.txt` → `/llms.txt` (site description for AI assistants).
- `app/layout.tsx` → Organization + WebSite JSON-LD schema, og:image
  (`/images/logos/logo-mark.png`), Twitter card, favicon and apple-touch icon.
- Route layouts (`app/*/layout.tsx`) → per-page meta titles, descriptions,
  and canonical URLs.
