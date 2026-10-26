# Turanda Architecture Reference

## 1. System overview

Turanda is a Next.js 13 App Router application for agricultural jobs, market prices, news, onboarding, messaging, notifications, advertising, and administration. The browser uses the Supabase anon key through `@supabase/supabase-js`; privileged operations run through Supabase Edge Functions or the server-only development seed script.

The repository intentionally uses the current root-level layout rather than a `src/` directory:

- `app/` contains routes and page-level UI.
- `components/` contains reusable interface pieces and feature modules.
- `hooks/` contains client-side data access and feature state.
- `lib/` contains shared configuration, types, translations, and Supabase setup.
- `supabase/migrations/` contains the database history.
- `supabase/functions/` contains server-side third-party integrations and privileged actions.
- `scripts/` contains server-only operational scripts.

## 2. Master feature-to-file reference

| Feature or responsibility | Responsible file path(s) | Notes |
|---|---|---|
| Application shell and global providers | `app/layout.tsx`, `app/globals.css`, `components/theme-provider.tsx`, `components/i18n-provider.tsx`, `components/auth-provider.tsx` | Layout, theme, language, and session context are initialized here. |
| Homepage | `app/page.tsx` | Composes hero, statistics, jobs, markets, and news. |
| Homepage hero | `components/home/hero-slider.tsx` | Hero content and visual rotation. |
| Homepage market pulse | `components/home/market-pulse.tsx`, `hooks/use-commodities.ts` | Market summary and price data. |
| Homepage news section | `components/home/news-section.tsx`, `hooks/use-news.ts` | Latest news display. |
| Integrations and browser Supabase client | `lib/supabase.ts` | Singleton `@supabase/supabase-js` client using public environment variables. |
| Central application configuration | `lib/app-config.ts`, `lib/constants.ts` | Branding, cities, categories, market sources, ads, feature switches, and map defaults. |
| Shared domain types | `lib/types.ts` | Job, application, profile, and related TypeScript shapes. |
| Jobs data fetching and mutations | `hooks/use-jobs.ts`, `app/jobs/page.tsx` | Lists jobs and creates, deletes, or changes job status. |
| Job browsing and filters | `app/jobs/page.tsx`, `components/jobs/job-filters.tsx`, `components/jobs/job-card.tsx` | Search, filtering, cards, and map/list views. |
| Job detail and applications | `components/jobs/job-detail-dialog.tsx`, `components/jobs/apply-dialog.tsx`, `components/jobs/cv-selector.tsx`, `hooks/use-applications.ts` | Application submission and CV selection. |
| Employer dashboard | `app/employer/page.tsx`, `components/employer/post-job-form.tsx`, `components/employer/application-list.tsx` | Employer job posting and application management. |
| Candidate dashboard | `app/dashboard/page.tsx` | Profile, weather, markets, news, academy, messages, documents, and notifications. |
| Google OAuth login | `components/auth/google-sign-in-button.tsx`, `components/auth-provider.tsx`, `app/auth/callback/page.tsx` | Supabase OAuth starts the flow; the callback routes to onboarding or the dashboard. Google credentials are configured in Supabase Auth, not in a browser API client. |
| Email/password login and signup | `app/login/page.tsx`, `app/signup/page.tsx`, `components/auth-provider.tsx` | Supabase Auth handles credentials and session creation. |
| Email verification | `components/auth-provider.tsx`, `app/signup/page.tsx`, Supabase Auth email settings | `resendEmailVerification` calls Supabase Auth. There is no custom SMTP client in this repository. |
| Phone verification and OTP | `components/auth-provider.tsx`, `app/onboarding/page.tsx`, `components/ui/input-otp.tsx` | Supabase Auth SMS OTP is the current provider path. `PHONE_VERIFICATION_PROVIDER` documents the future provider boundary. |
| reCAPTCHA | `components/recaptcha.tsx`, `app/api/recaptcha-verify/route.ts` | Client token generation and server verification route. A missing site key uses the documented development fallback. |
| Terms and consent | `components/terms-modal.tsx` | Signup terms dialog and localized content. |
| Profile and onboarding data | `app/onboarding/page.tsx`, `app/dashboard/page.tsx`, `components/auth-provider.tsx`, `hooks/use-site-settings.ts` | Profile completion and phone verification gating. |
| Profile documents and CVs | `components/profile/document-manager.tsx`, `hooks/use-documents.ts`, `components/jobs/cv-selector.tsx` | User document management and application CV selection. |
| Weather integration | `hooks/use-weather.ts`, `components/layout/navbar-weather.tsx`, `app/dashboard/page.tsx`, `lib/app-config.ts` | Weather uses configured coordinates and optional provider settings. |
| Commodity markets | `app/commodities/page.tsx`, `app/piyasalar/page.tsx`, `components/commodities/commodity-section.tsx`, `components/commodities/commodity-admin.tsx`, `hooks/use-commodities.ts` | Exchanges, prices, sources, logs, registry, categories, and icon overrides. |
| Commodity ingestion | `supabase/functions/fetch-commodities/index.ts`, `supabase/config.toml` | Server-side fetch and persistence for configured sources. |
| News | `app/haberler/page.tsx`, `components/home/news-section.tsx`, `hooks/use-news.ts` | News records are read from Supabase. |
| News ingestion | `supabase/functions/fetch-news/index.ts`, `supabase/config.toml` | Server-side news fetch and persistence. |
| AI thumbnails | `supabase/functions/generate-thumbnail/index.ts`, `components/shared/icon-uploader.tsx`, `lib/svg-sanitizer.ts` | Provider secrets stay server-side; generated media is persisted through Supabase. |
| Academy | `app/akademi/page.tsx`, `app/akademi/[courseId]/page.tsx`, `app/akademi/[courseId]/[lessonId]/page.tsx`, `components/academy/academy-admin.tsx`, `hooks/use-academy.ts` | Course browsing, lessons, enrollments, and admin management. |
| Messaging | `app/messages/page.tsx`, `hooks/use-messages.ts`, `lib/notifications.ts` | Conversations, messages, unread counts, and notification creation. |
| Email notification templates | `lib/notifications.ts` | Generates localized HTML notification bodies and stores pending notifications. It does not instantiate SMTP, SendGrid, Resend, or Nodemailer. |
| Email notification delivery | `supabase/functions/send-notification/index.ts`, `supabase/config.toml` | Sends stored notification records using the configured Edge Function provider. |
| Advertising | `app/advertise/page.tsx`, `app/admin/ads/page.tsx`, `components/ads/*`, `hooks/use-site-settings.ts` | Ad spaces, requests, rendering, and admin controls. |
| Payments | `components/checkout/checkout-modal.tsx`, `supabase/functions/process-payment/index.ts` | Payment provider secrets are server-side. Current function reads Iyzico credentials. |
| Admin dashboard | `app/admin/dashboard/page.tsx`, `app/admin/ads/page.tsx` | Admin content, users, markets, jobs, academy, ads, and notifications. |
| Admin privilege changes | `supabase/functions/admin-user-action/index.ts`, database RPCs in `supabase/migrations/20260927045144_create_admin_content_tables.sql` and `20260927051253_add_user_ban_and_management.sql` | Edge Function verifies the current user is an admin before calling privileged database functions. |
| Dynamic icons and safe SVGs | `components/shared/icon-renderer.tsx`, `components/shared/icon-uploader.tsx`, `lib/icon-catalog.ts`, `lib/svg-sanitizer.ts` | Only catalogued Lucide icons or sanitized custom SVG paths should be rendered. |
| Notifications UI | `components/notifications/notification-log.tsx`, `lib/notifications.ts`, `supabase/functions/send-notification/index.ts` | Pending and delivered notification records. |
| Development test accounts | `scripts/seed-test-accounts.mjs`, `components/dev/dev-account-switcher.tsx`, `app/dev/page.tsx` | Server-only seed uses the Supabase service role; the page is unavailable in production mode. |
| Scheduled tasks / cron jobs | No current scheduled worker or cron route | The repository has Edge Functions but no `/api/cron/*` endpoint or background scheduler. External cPanel cron must call a future authenticated route or invoke an approved Edge Function. |
| Embeddable widgets / UI extensions | `components/home/market-pulse.tsx`, `components/layout/navbar-weather.tsx`, `components/ads/ad-space-renderer.tsx` | These are internal reusable UI widgets; there is no public third-party embed bundle. |
| HTTP route handlers | `app/api/recaptcha-verify/route.ts` | The only current Next.js API route is reCAPTCHA verification. |
| Deployment configuration | `next.config.js`, `Dockerfile`, `netlify.toml`, `.env.example` | Standalone Next output is enabled; Docker starts the generated `server.js`. |

## 3. Request and data flow

1. A route in `app/` renders a page and feature components.
2. Client hooks call `lib/supabase.ts` with the anon key and the active user session.
3. Supabase Row Level Security determines which rows and operations are allowed.
4. Third-party calls that require secrets go through `supabase/functions/`.
5. Edge Functions persist durable results in Supabase rather than relying on process memory.
6. UI components render loading, empty, and error states from their hooks.

The browser must never receive `SUPABASE_SERVICE_ROLE_KEY`, provider secrets, SMTP passwords, or payment secrets.

## 4. Authentication and authorization

Supabase Auth owns the identity record. The application profile is stored in `profiles`, keyed by the Auth user ID. The client session is loaded in `components/auth-provider.tsx`, which then loads or creates the matching profile.

The main account states are:

- **Verified and onboarded:** `profiles.onboarded = true`, `profiles.phone_verified = true`, and `profiles.is_verified = true`.
- **Pending onboarding:** `profiles.onboarded = false` or `profiles.phone_verified = false`.
- **Administrator:** `profiles.is_admin = true`. Admin writes to privileged user fields go through `admin-user-action` and database functions.

The UI guards are not the security boundary. Supabase RLS and the admin Edge Function are the security boundary.

## 5. Database and migrations

The database change history is under `supabase/migrations/`. Important groups include:

- Jobs and applications: `20260926200613_create_jobs_and_applications.sql`.
- Profiles and news: `20260926215056_create_profiles_and_news.sql`.
- Commodity tables and dynamic source management: `20260926214631_create_commodity_tables.sql`, `20260930043334_20260930120000_create_dynamic_commodity_system.sql`, and related migrations.
- Admin content and user management: `20260927045144_create_admin_content_tables.sql`, `20260927051253_add_user_ban_and_management.sql`.
- Documents and CVs: `20260930180910_20260930170000_create_user_documents_and_application_cv.sql.sql`.
- Messaging: `20260930200802_20260930210000_create_messaging_system.sql.sql`.

When changing schema or RLS, use a new idempotent Supabase migration and review the current security posture before deployment.

## 6. Edge Functions

The deployed function configuration is in `supabase/config.toml`:

- `fetch-news` and `fetch-commodities` are public ingestion entry points and must be protected by an external scheduler or a secret when used in production.
- `generate-thumbnail` handles server-side image generation.
- `admin-user-action` and `process-payment` require a JWT.
- `send-notification` processes notification delivery and should be called only by trusted application flows or a protected scheduler.

Every function must return the required CORS headers on preflight, success, and error responses.

## 7. Known operational gaps

- No custom SMTP client is present. Supabase Auth and the notification Edge Function are the email boundaries.
- No cron route is present. A production scheduler must be added before configuring recurring cPanel requests.
- No public widget SDK or embeddable script is present.
- The test account seed is intentionally an operational script, not a production migration.
- `next.config.js` uses standalone output. cPanel deployment should run the generated standalone `server.js`, not `next start` against a source checkout.
