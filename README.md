# ZiaSnap

Snap a meal, get an editable nutrition estimate from a Zia Agent, and track it against your goals. Next.js 15 frontend on Catalyst Slate, backend on Catalyst Functions (US DC, project `ziasnap`).

## Two modes

| Mode | When | Data | Sign-in |
|------|------|------|---------|
| **Mock** | `NEXT_PUBLIC_ZIASNAP_API_URL` unset | In-memory demo user via `src/app/api/mock/*` | None |
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

1. `npm run build:api`
2. `catalyst deploy --only functions:ziasnap-api -ni`
3. `catalyst deploy slate ziasnap -ni` (builds with `.env.production`, so it ships in real mode)

Deploy the function first: a real-mode frontend without the function can't load any data.

## More

Full documentation (features, architecture, API reference, data model): [docs/ZIASNAP.md](docs/ZIASNAP.md). Screenshots are in [docs/screenshots](docs/screenshots).
