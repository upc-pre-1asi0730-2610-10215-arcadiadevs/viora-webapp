# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.10.0] - 2026-07-06

### Added

- Password policy on registration: `sign-up-form.vue` now enforces ≥8 characters, one uppercase letter, one lowercase letter, one number, and one special character, with a live-updating requirements checklist under the password field. Ported from `os-viora-webapp@86415d3` (Parity Roadmap v2, cluster 3).

## [2.9.1] - 2026-07-06

### Fixed

- Mock subscriptions now include `planName`, matching the real `SubscriptionResource` contract from `os-viora-webapp`/`os-viora-platform`. `subscription-overview.vue` already had a fallback so nothing visibly broke, but the mock data shape was incomplete.

## [2.9.0] - 2026-07-06

### Added

- Payment-first onboarding: a public `/plans` screen (grower/specialist segments), a `subscriptionGuard` on every workspace route, and a registration flow that requires a chosen plan before creating an account. Ported from `os-viora-webapp@3ffa140..661fbf3` (Parity Roadmap v2, cluster 2).
- `subscription-access.store.js` caches whether the signed-in user has an active subscription; sign-out resets it.
- Mock server now tracks subscriptions per user (`db.json`), so new sign-ups start unsubscribed and `POST /checkouts` approves instantly, pointing back at `/dashboard` — a simplified stand-in for the real MercadoPago redirect until `wa-viora-platform`'s checkout contract is finalized.

## [2.8.1] - 2026-07-06

### Fixed

- `plot-boundary-map.vue`: boundary vertices are now ordered by angle around their centroid before being drawn or saved, so clicking corners out of sequence no longer produces a self-intersecting (bow-tie) plot polygon. Markers still show the raw click position. Ported from `os-viora-webapp@1f0c785` (Parity Roadmap v2, cluster 1).

## [2.8.0] - 2026-07-06

### Added

- Mock server support for the specialist marketplace: `GET /intervention-marketplace` and `POST /service-proposals` (previously missing entirely, marketplace view always rendered empty).
- Unified money formatting into `src/shared/domain/model/money.js`, replacing duplicated `CURRENCY_SYMBOLS`/`formatMoney` logic across the expense, plan, invoice, subscription, and service-proposal entities.
- ComingSoon placeholders for the still-unbuilt "My Requests"/"Field Inspection" sidebar links, replacing dead links found during the specialist-view QA pass.

### Fixed

- `/plans` and `/subscriptions/:userId` in the mock server now use segment-aware (`grower-`/`specialist-` prefixed) plan codes, so the specialist plan filter (Phase 7) actually matches instead of returning nothing.
- Decline/verify actions on marketplace cases 5 and 6 returned 404 — missing matching `intervention-requests` fixture rows.
- `settings-overview.vue`: role-aware live-preview copy, and the location preview now gates on `latitude`/`longitude` instead of the raw location string.
- `subscription-overview.vue`: cancel-subscription copy no longer shows grower-only feature language for specialist accounts.
- `case-detail.vue`: missing `.avatar--xs` CSS modifier caused a layout break in the decline-proposal modal.

This closes out the specialist-side feature parity QA pass (`docs/specialist-parity-roadmap.md`, Phases 0-8).

## [2.7.18] - 2026-07-06

### Added

- Specialist photo/identity polish across `case-detail.vue` and `expert-assistance-overview.vue` (Phase 8, final phase of the specialist-parity roadmap): `SpecialistCandidate` gains `photoUrl`, avatars render the photo when present and fall back to initials otherwise. `successRate`/`distanceKm` now default to `null` instead of `0` — the UI shows "No ratings yet" / "—" rather than a fabricated 0% or 0km when the backend hasn't provided real match data yet.

This completes the specialist-side feature parity port from os-viora-webapp (`docs/specialist-parity-roadmap.md`, Phases 0-8).

## [2.7.17] - 2026-07-06

### Added

- Specialist variant of the subscription overview (Phase 7 of the specialist-parity roadmap, porting os-viora-webapp): plans are filtered by segment (`grower-`/`specialist-` code prefix), specialist plans display as "Specialist Plus"/"Specialist Pro" with dedicated taglines and feature lists, and a Pro-badge status card shows eligibility. The plot/IoT usage section and its data fetch are now skipped for specialist accounts, which have neither.

## [2.7.16] - 2026-07-06

### Added

- Phone number required at specialist sign-up (Phase 6 of the specialist-parity roadmap, porting os-viora-webapp): the sign-up form now requires a phone number only when the selected role is specialist, mirroring the reference's `phoneRequired` getter.

### Fixed

- `IamApi.signUp()` was silently dropping `role` and `referralCode` from the sign-up request body — only `username`/`password`/`email`/`fullName` were ever sent to the backend. Now all fields (plus the new `phone`) are forwarded.

## [2.7.15] - 2026-07-06

### Added

- Specialist marketplace fields on the account profile (Phase 5 of the specialist-parity roadmap, porting os-viora-webapp): `UserProfile` gains `latitude`/`longitude`, `serviceRadiusKm` (25-500, default 150), `serviceTags`, and `marketplaceVisible`; a fixed service-tag catalogue (`service-tags.catalog.js`) with `parseServiceTags()`; a reusable `location-picker-modal.vue` (Mapbox search, click-to-place, drag marker, reverse geocoding, graceful fallback without `VITE_MAPBOX_ACCESS_TOKEN`) reusing the existing `mapboxService`; and specialist-only fields wired into Settings (service-tag chips, radius control, marketplace-visibility toggle). Phone is now mandatory when saving a specialist profile.

## [2.7.14] - 2026-07-06

### Added

- Specialist Intervention Marketplace overview view (Phase 4 of the specialist-parity roadmap, porting os-viora-webapp): `specialist-marketplace-overview.vue` renders the Phase 3 read model — KPI cards, incoming case cards with decline/review actions, a compact case log table, and a submit-proposal modal with the same default proposal values as the reference. Registers the `/specialist/marketplace` route, which previously had no route at all (the sidebar link was pointing nowhere).

## [2.7.13] - 2026-07-06

### Added

- Specialist Intervention Marketplace domain, API gateway, and Pinia store (Phase 3 of the specialist-parity roadmap, porting os-viora-webapp): read model entity (`SpecialistMarketplace`/case list), response assembler, and a store with `load`/`refresh`, `submitProposal` (with the `specialistId` assignment guard) and `decline` actions on incoming cases, mirroring Phase 1's specialist-dashboard trio (cache-once loading, `errors` ref, optimistic removal with reload-on-error reconciliation).

## [2.7.12] - 2026-07-06

### Added

- Specialist dashboard overview view (Phase 2 of the specialist-parity roadmap, porting os-viora-webapp): `specialist-dashboard-overview.vue` renders the Phase 1 read model — headline KPIs, zonal risk radar, incoming producer requests with verify/decline actions, and a monthly/annual performance chart (Chart.js, matching `trend-analysis-card.vue`'s charting approach). Wired into the shared `/dashboard` role router, replacing the specialist coming-soon placeholder so specialist accounts now land on a real workspace.

## [2.7.11] - 2026-07-06

### Added

- Specialist dashboard domain, API gateway, and Pinia store (Phase 1 of the specialist-parity roadmap, porting os-viora-webapp): read model entity, response assembler, and a store with `load`/`refresh`, monthly/annual performance toggle, and optimistic `verify`/`decline` actions on incoming producer requests. On fetch failure the store surfaces a real empty state — no fabricated data — matching the existing `interventions.store.js` convention. Local mock server gained matching `specialist-dashboard` fixtures and `verifications`/`declines` routes.

## [2.7.10] - 2026-07-06

### Added

- Role-aware routing for the shared `/dashboard` path (Phase 0 of the specialist-parity roadmap, porting os-viora-webapp's specialist workspace): a new `dashboard-role-view.vue` renders the producer dashboard or a specialist placeholder based on session role, and the sidebar swaps its navigation items for specialist accounts. Foundation for the specialist dashboard/marketplace views coming in later phases.

### Fixed

- `.env.development` had drifted into version control despite matching `.gitignore`, and had picked up a real Mapbox access token in a local WIP commit; untracked it (kept locally, un-versioned going forward).

## [2.7.9] - 2026-07-06

### Fixed

- `referral-code.entity.js` was a stray copy-paste of `subscription.entity.js` (wrong class, wrong fields) — rewrote it to the `ReferralCode` shape its own callers already expected (`userId`, `code`, `rewardPercent`, `rewardLabel`, `shareLink`), fixing the "ReferralCode is not exported" build failure
- `subscription.entity.js` used typescript's `readonly` field modifier in a plain `.js` file, which no js parser could parse; removed it to match every other entity in the app

## [2.7.8] - 2026-07-06

### Added

- eslint 9 flat config with an `import/no-restricted-paths` rule enforcing that each bounded context's `domain/` and `infrastructure/` are private; only a context's own `application/*.store.js` may be imported cross-context. `npm run lint` added.

### Fixed

- `profile.store.js` now loads farm totals through `useagronomicstore()` instead of instantiating agronomic's raw api/assembler classes directly, the last real cross-context boundary violation surfaced by the new lint rule

## [2.7.7] - 2026-07-06

### Removed

- dead `simulatespecialistresponse`/`simulateprescription` endpoints and their ui buttons in the intervention context, verified against the live wa-viora-platform backend to have no matching route; the real specialist-side flow already ships as `/intervention-requests/{id}/verifications` and `/declines`

## [2.7.6] - 2026-07-06

### Fixed

- `interventions.store.js` now surfaces errors from every catch block into an `errors` array, matching the pattern already used by its sibling `intervention.store.js`, instead of silently swallowing failures

## [2.7.5] - 2026-07-06

### Fixed

- `expenseassembler` converted from a plain object literal to a static-method class, matching every other assembler in the app
- renamed `toentitiesfromresources` to `toentitiesfromresponse` for naming consistency, and updated its one caller

## [2.7.4] - 2026-07-06

### Changed

- agronomic expense store now exposes `recordfromspecialistintervention`, owning the classification of specialist-intervention expenses instead of leaving it to the intervention bounded context
- intervention's case-detail view now supplies only the facts it owns (plot, intervention reference, accepted amount/currency/service title) when recording a specialist expense
- synced `package-lock.json` version field, which had drifted behind `package.json` since the 2.7.1 release

## [2.7.1] - 2026-07-03

### Added

- expense entity and assembler for agronomic context
- expense history overview view with modal and CSV export
- trend analysis card component for agronomic dashboard
- iam user entity, authentication guard, sign-in/up assemblers and resources
- iam routes configuration
- surveillance recommended actions card
- referral and coupon images for billing presentation

### Changed

- updated router.js and workspace-routes.js with agronomic route definitions
- updated vite.config.js proxy settings
- updated .env.development with api endpoints

## [2.7.0] - 2026-07-03

### Changed

- DDD architecture audit and refactoring across all bounded contexts
- agronomic presentation views no longer import infrastructure directly (assemblers, API gateways)
- agronomic store extended with 11 new methods for data loading
- expense-api refactored to extend BaseApi with BaseEndpoint
- profile store gains loadFarmTotals with documented Context Map dependency on agronomic
- shared kernel decoupled from iam via interceptor registry pattern
- iam store uses shared IamApi singleton instance
- iam domain gains SignInCommand and SignUpCommand command objects
- iam store methods return {success, error} results instead of handling navigation
- navigation (router.push) moved from stores to presentation layer

### Added

- shared/infrastructure/interceptor-registry.js for cross-context interceptor registration
- iam/infrastructure/iam-api-instance.js for IamApi singleton
- iam/domain/model/sign-in.command.js and sign-up.command.js command objects

### Fixed

- expense-api missing auth interceptor (was using native fetch without Bearer token)
- iam store duplicated IamApi instances across iam.store.js and security.store.js

## [2.6.0] - 2026-07-03

### Added

- shared dashboard header component
- router imports and route definitions for all bounded contexts

### Changed

- align agronomic analysis entity with platform backend contract
- update agronomic assembler and api for real backend endpoints
- refine dashboard toolbar controls

## [2.5.0] - 2026-07-03

### Added

- community risk model and assembler for surveillance
- pest sighting reports and symptom dictionary integration
- alerts and community risk map presentation components
- surveillance routes and views

### Changed

- align surveillance domain model with platform backend contract
- update surveillance api and assembler for real backend endpoints
- extend surveillance store with community risk and pest report actions

## [2.4.0] - 2026-07-03

### Added

- profile bounded context with settings and user profile management

## [2.3.0] - 2026-07-03

### Added

- intervention bounded context with expert assistance and case management

## [2.2.0] - 2026-07-03

### Added

- iam bounded context with authentication and session management

## [2.1.0] - 2026-07-03

### Added

- billing bounded context with subscription and payment management

## [2.0.0] - 2026-07-03

### Added

- support bounded context with faq and legal documents
