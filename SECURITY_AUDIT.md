# Security and hosting audit

Date: 2026-10-26. Baseline: `cbfe31a5ba1f2a2972e2552f9949f148fc259580`.
Scope: npm dependencies, Next.js build/deployment, sensitive browser rendering, privileged Edge Function entry points, verification/payment fallbacks, and job/application access. This is a source/configuration audit with local regression tests, not a penetration test of a deployed server.

## Dependency results

| npm audit snapshot | Critical | High | Moderate | Total vulnerable package entries |
| --- | ---: | ---: | ---: | ---: |
| Before changes | 1 | 16 | 4 | 21 |
| After updates and PostCSS override | 0 | 0 | 0 | 0 |

Counts are npm package entries, not independently exploitable attack paths. The baseline installed dependencies came from an older preparation snapshot; the final result uses a fresh `npm ci` and the updated lockfile. Registry advisories can change; rerun `npm audit` during release preparation.

Changes include Next.js 13.5.1 → **15.5.28**, React **18.3.1**, updated Supabase/transitive packages, patched Zod 4/resolvers, and a same-major PostCSS override to **8.5.23+** because Next.js 15 pins an affected older copy. All Edge Function Supabase SDK imports are pinned to **2.118.0**; a separate Deno lock-resolution audit also reports no known vulnerabilities. Build, lint, typecheck and tests must continue to validate that override on upgrades. Build tools/type packages are now dev dependencies. Removed the unused SWC WASM pin and local Netlify plugin dependency; Netlify's plugin remains declared in its deployment configuration.

## Findings addressed

| Severity | Finding at baseline | Change |
| --- | --- | --- |
| Critical | Vulnerable framework/dependency tree. | Patched dependencies and reproducible lockfile; final npm audit reports zero known vulnerabilities. |
| Critical | Missing SMS provider returned/logged the OTP; verification was not bound to the requesting account and used non-atomic attempt/consume updates. | Require authenticated, non-banned callers and Twilio delivery; cryptographic random codes; service-only SQL functions bind codes to user/phone, serialize issuance, lock verification rows, limit attempts, and atomically consume/update the profile. |
| High | Commodity ingestion and thumbnail generation used service-role operations without staff authorization; notifications accepted unauthenticated requests. | Validate JWTs with Auth and check allowed staff flags; admin/service-role access for delivery, staff/service-role for ingestion/images; reject unsupported methods. Existing news ingestion already had staff authorization. |
| High | Payments could simulate `paid` with missing provider keys; an unconfirmed PaymentIntent was treated as success, and the browser granted listing benefits. | Payment endpoint returns unavailable; checkout no longer collects cards or writes payment/entitlement fields. Database trigger blocks ordinary users from forging paid/featured status. |
| High | Own-profile insertion could include privileged flags; client-side filtering was incomplete. | Database trigger protects role/ban/verification fields on insert/update, strips additional privileged fields from profile updates, and resets phone verification when a user changes their phone. Email/native SMS confirmation is synchronized by an Auth database trigger; new profiles derive verification from authoritative Auth records. Browser writes to verification flags were removed, and only editable profile columns receive UPDATE grants. |
| High | Shared database policies allowed signed-in users to manage all jobs and read/update all applications. | User-selected ownership model: creator-owned new jobs, employer/admin mutation policies, applicant/owner/admin reads, employer status-only updates, document ownership checks, bound conversation creation and protected participant IDs. Message triggers preserve sender identity/content and limit ordinary updates to recipient read receipts. Existing jobs require verified admin assignment. |
| High | Storage SVGs were inserted directly into the DOM; upload sanitizer used regular expressions. | DOMPurify sanitizes on upload and render; active elements, external hrefs, and style injection are stripped. |
| Medium | reCAPTCHA endpoint accepted a magic token and missing keys as success; the component did not call it. | Verify with Google; reject missing configuration and bypass tokens, verify hostname/action/score/age, refresh the UI check, and use timeouts. This does not replace protection on direct Supabase APIs. |
| Medium | Login/signup accepted arbitrary `next` destinations. | Restrict destinations to same-site paths and reject browser slash/control-character normalization bypasses. |
| Medium | Seed command could create public test credentials without an explicit development gate. | Require explicit development enablement and reject production environment settings. Never seed the live project. |
| Medium | Administrative function referenced an undeclared RPC parameter object and did not reject banned administrators/unknown actions. | Construct parameters, validate allowed actions/target IDs, reject banned administrators, and avoid returning raw internal errors. |
| Hosting | Node 18 container baseline, missing public build arguments, incomplete deployment instructions and no safe artifact assembly. | Node 24 runtime, public build arguments, runtime-only secret, non-root container, loopback binding, liveness route, environment checks, complete standalone packager, Passenger launcher, and replacement deployment guide. |

The first CodeRabbit review reported three findings: two related to email verification/column privileges and one stale paid-form callback. Verification now runs through an Auth database trigger and uses authoritative Auth proof; browser verification writes and the unused paid callback/client entitlement fields were removed. The second completed review reported two minor findings: paid-tier selection could strand form submission while checkout was unavailable, and deployment instructions overstated runtime changes to the public site URL. Paid tiers are now disabled with a localized explanation; the guide states that changing the hostname requires a rebuild, and redundant runtime public settings were removed. All five findings across those two passes were addressed. Any subsequent finalization review results are recorded in the task completion report.

Basic response headers now prevent framing, MIME sniffing, object embedding, and third-party base URLs. The CSP is deliberately limited; the app uses inline scripts, third-party images/maps, and external providers, so this is not a complete script-src policy. HTTPS/HSTS and reverse-proxy limits remain host configuration.

## Intentional contract changes

The original job migration explicitly documented shared/public MVP access (`20260926200613_create_jobs_and_applications.sql`); later policies required sign-in but kept unrestricted authenticated writes and application reads. After this contradiction was explained, the user selected owner restrictions. The new migration changes those guarantees; it does not backfill guessed owners or delete legacy records. Public job discovery is preserved, and local tests cover both the new restrictions and public reads.

`process-payment` previously promised a simulated successful fallback, and `send-phone-otp` exposed development codes when delivery was absent. Security hardening removes those success paths. Paid checkout needs a separate, complete integration before it can be enabled; SMS requires configured delivery. Forms now need valid reCAPTCHA settings.

## Validation and limits

- Security unit/integration tests use synthetic users, tokens, provider replies, SVG payloads, and configuration.
- Database regression fixtures execute the two new migrations in disposable PostgreSQL 17, exercising privilege/payment guards, OTP replay/account binding/attempt limits, owner isolation, applicant privacy, employer status updates, public browsing, and conversation participant protection. These tests do not replay the entire historical Supabase schema or establish your deployed RLS state.
- Production build/package, TypeScript, eight security tests, HTTP/cloud-browser checks, and the Passenger launcher passed locally. Lint passed with zero errors and 19 existing warnings. The Docker image builds and runs as UID 1001; Compose configuration validates. Synthetic provider settings were used, so these checks do not establish live-service readiness.
- The liveness endpoint intentionally performs no provider/database query. A successful response does not prove login/SMS/provider readiness.
- The emulator v0.0.1 catalog was inspected. It has no Supabase service. Twilio/Resend exist, but this application's provider URLs are fixed and provide no endpoint override. No real provider credentials were used; native Supabase Auth/Storage/Realtime, SMS, OAuth, email, cron/Vault, and hosted Passenger/TLS still need staging/production smoke checks.
- Existing lint warnings about legacy images, hooks, and accessibility are tracked separately from security; audit scope does not claim every screen or migration has been exhaustively reviewed.

## Remaining launch work

1. Apply both migrations and deploy the changed Edge Functions. Local source fixes do not change the live Supabase project.
2. Verify and assign existing job owners. Review legacy conversations/nullable applicant IDs; this patch protects new conversation creation and identifier updates, not historical identity correctness.
3. Review existing roles, phone-verification flags, featured/payment records, and test accounts for historical misuse. Correct data through a trusted administrative process; this patch does not silently rewrite it.
4. Configure Supabase-native bot protection and rate limits. The browser's reCAPTCHA verification can be skipped by clients talking directly to Supabase; RLS and provider-level controls remain required. The verification endpoint also needs host-level request throttling.
5. Review remaining profile exposure under the existing authenticated profile-read policy. It can expose profile contact/location/preferences to other signed-in accounts. Field-level privacy and a public profile view need a separate product/data-access decision; job/application ownership does not make all profiles private.
6. Automatic application/message emails are not complete: the browser attempts outbox inserts, but existing admin-only RLS rejects ordinary users. Move recipient/template generation to trusted server triggers/functions and escape user text before enabling automatic email. The new delivery authorization does not provide that workflow.
7. Before live payments, implement hosted/tokenized checkout, server-owned pricing/ownership checks, signed webhook verification, idempotency, and server-side entitlement writes. Leave the current unavailable response in place until then.
8. Verify backups/restoration, HTTPS, canonical domain, secrets, outbound provider access, and hosting-plan support using the deployment guide. No remote host was deployed or production database changed in this task.
