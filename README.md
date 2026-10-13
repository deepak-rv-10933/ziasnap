# ZiaSnap

Snap a meal, get an editable nutrition estimate from a Zia Agent, and track it against your goals. Next.js 15 frontend exported as a static site on Catalyst Slate (app `ziasnap-app`), backend on Catalyst Functions (US DC, project `ziasnap`).

## Two modes

| Mode | When | Data | Sign-in |
|------|------|------|---------|
| **Mock** | `NEXT_PUBLIC_ZIASNAP_API_URL` unset | Demo user, answered in the browser by `src/lib/api/local-backend.ts` | None |
| **Real** | `NEXT_PUBLIC_ZIASNAP_API_URL` set (see `.env.production`) | Catalyst Data Store + Stratus via the `ziasnap-api` function | Catalyst hosted login (Zoho) |

Both modes use the same `NutritionRepository` interface (`src/services/nutrition/NutritionRepository.ts`). The API client (`src/lib/api/client.ts`) writes every call against the mock path and, in real mode, sends it to the function with the user's token instead.

Mock mode is for UI work and screenshots: `npm run dev` (no `.env.local` API URL). Real mode needs `catalyst serve`. The native dev server lacks Catalyst's `/__catalyst/sdk/init.js` and session, so sign-in fails there.

## Backend: `functions/ziasnap-api`

- TypeScript in `functions/ziasnap-api/src/`, bundled with the shared code under `src/` into `functions/ziasnap-api/index.js` by `npm run build:api`. **Don't edit `index.js` by hand.**
- Every route resolves the signed-in app user first and only ever touches rows where `UserId` matches. Tables are GLOBAL scope and accessed only through the function's admin scope.
- Photos are never stored: the browser sends one with each analysis request, the function forwards it to Zia, and it is discarded.
- Meal analysis calls the deployed Zia Agent through the Catalyst Connection `agents`, asynchronously: `POST …/analyze` starts it and the client polls `GET …/analyze/<token>`, because a vision run (~25s) is too close to the 30s function limit.

Tables: `UserProfile`, `Meals`, `MealItems`, `WeightLogs`, `WaterLogs`, `Favorites`, `FoodCorrections`.

## Deploy order

1. `npm run build:api` (typechecks and bundles both functions; needs `functions/ziasnap-api/.env.local`)
2. `catalyst deploy --only functions:ziasnap-api,functions:ziasnap-weekly-coach -ni`
3. `npm run build:web` (static export to `out/`, stamps the service worker's pre-cache list)
4. `catalyst deploy slate ziasnap-app -m "short message" -ni` (uploads `out/` as a static site; keep the message short)

Deploy the functions first: a real-mode frontend without them can't load any data.

**Why static:** the old server-rendered Slate app (`ziasnap`, ziasnap.onslate.com) ran every page through a 2 GB server function. That cost ~1 s per request and used up Slate's free tier. The static app has no server function at all. The public demo (`/demo`) runs entirely in the browser, and a service worker pre-caches the whole app after the first visit, so repeat visits open in about 0.1 s.

`ziasnap-weekly-coach` is a Job function scheduled by the `ziasnap_weekly_recap` cron (Sundays 18:00 IST, job pool `ziasnap_jobs`). Set `RECAP_FROM_EMAIL` on it to a verified Catalyst sender to email recaps too.

## More

Full documentation (features, architecture, API reference, data model): [docs/ZIASNAP.md](docs/ZIASNAP.md). Screenshots are in [docs/screenshots](docs/screenshots).
