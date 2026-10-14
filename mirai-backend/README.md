# MIRAI Backend

Node 24 + TypeScript (strict) + Express 5 + Mongoose 8 + zod. All routes are under **`/api/v1`**.

## Run

```bash
npm install
cp .env.example .env        # then set secrets (a ready-made dev .env already exists locally)
npm run dev                 # tsx watch src/server.ts  -> http://localhost:5000/api/v1
npm run typecheck           # tsc --noEmit
npm run build               # tsc -> dist/ (+ copies src/locales to dist/locales)
npm start                   # node dist/server.js
```

Requires MongoDB (default `mongodb://127.0.0.1:27017/mirai`). Redis is optional: without `REDIS_URL` the cache is an in-memory Map (health reports `redis: "disabled"`).

### Dev login without email
With `NODE_ENV != production` and `DEV_FIXED_OTP=1234`, OTP `1234` is always accepted for any email.
Without `SMTP_HOST`, real OTPs are printed to the server console (`[auth] OTP for x@y.com: 4821`).
`DEV_FIXED_OTP` is ignored in production.

## Environment variables
See `.env.example` (every var documented). Validated at boot by `src/config/env.ts`; import `env` from there, never read `process.env` directly. To add a var: add it to the zod schema in `env.ts` **and** to `.env.example`.

| Group | Vars |
|---|---|
| Server | `NODE_ENV`, `PORT` (5000), `PUBLIC_BASE_URL`, `CORS_ORIGINS` (`*` or comma list), `LOG_LEVEL`, `TRUST_PROXY` |
| Data | `MONGODB_URI`, `REDIS_URL` |
| JWT | `JWT_ACCESS_SECRET`/`_EXPIRES` (1d), `JWT_REFRESH_SECRET`/`_EXPIRES` (30d), `JWT_ADMIN_SECRET`/`_EXPIRES` (1d) |
| OTP | `OTP_LENGTH` (4, range 4-6), `OTP_EXPIRY_MINUTES` (10), `OTP_MAX_ATTEMPTS` (5), `DEV_FIXED_OTP` |
| SMTP | `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` |
| 3rd party | `DIVINE_API_KEY`, `DIVINE_AUTH_TOKEN`, `ANTHROPIC_API_KEY`, `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_S3_BUCKET`, `FIREBASE_SERVICE_ACCOUNT_PATH` |
| Admin | `ADMIN_SEED_EMAIL`, `ADMIN_SEED_PASSWORD` |

## Project structure

```
src/
  server.ts               connect DB -> listen; graceful shutdown (SIGINT/SIGTERM)
  app.ts                  createApp(): requestId, language, pino-http, helmet, cors, compression, json, rate limit, /api/v1 router, notFound, errorHandler
  config/env.ts           zod-validated, typed `env`
  lib/
    db.ts                 connectDB(), disconnectDB(), mongoStatus()
    cache.ts              `cache` (Redis or in-memory): get/set(ttl)/del/delPattern/flushAll/wrap/status
    logger.ts             pino `logger`
    mailer.ts             sendMail({to,subject,text,html}), isMailerConfigured()
    jwt.ts                sign/verify Access, Refresh, Admin tokens
    i18n.ts               t(req,key,params), translate(lang,key,params), resolveLang()
  locales/en.json, hi.json   flat message keys
  middleware/
    requestId.ts          X-Request-Id (honours incoming)
    language.ts           req.lang from Accept-Language
    auth.ts               requireAuth, optionalAuth, extractBearerToken
    admin.ts              requireAdmin, setAdminLoader
    validate.ts           validate({ body, query, params })
    rateLimit.ts          createRateLimiter(), clientIp(), globalRateLimiter, otpSendLimiter, authLimiter
    errorHandler.ts, notFound.ts
  utils/
    response.ts           sendSuccess(), sendError()
    ApiError.ts           ApiError (+ static badRequest/unauthorized/forbidden/notFound/conflict/tooMany/internal)
    asyncHandler.ts       asyncHandler(fn)
    pagination.ts         parsePagination(), buildPaginated(), paginate(), paginationQuery
    validators.ts         zod: objectId, email, time24h, isoDate, idParam()
    zodiac.ts             getSunSign(date), ZODIAC_SIGNS, isZodiacSign()
  types/express.d.ts      req.user, req.sessionId, req.admin, req.lang, req.requestId
  routes/index.ts         central router (list of modules)
  jobs/notificationJobs.ts scheduled notifications (IST): muhurat 06:30, daily horoscope 07:00, weekly Mon 08:00, festival (tomorrow) 08:00; respects user.notificationPrefs, deduped per user/period in NotificationJobLog
  modules/<name>/         <name>.model.ts / .validation.ts / .service.ts / .controller.ts / .routes.ts
```

## Conventions (the app and admin panel depend on these)

### Response envelope
```json
{ "success": true,  "statusCode": 200, "message": "Profile fetched successfully.", "data": { "user": {} } }
{ "success": false, "statusCode": 400, "message": "Validation failed. Please check your input.",
  "errors": [{ "field": "email", "message": "Invalid email address" }] }
```
- Success: `return sendSuccess(res, statusCode, 'module.messageKey', data?, params?)`. Omit `data` (undefined) for message-only responses.
- Errors: `throw ApiError.notFound('module.notFound')` / `throw new ApiError(422, 'key', { params, errors })`. Never `res.status(...).json(...)` by hand.
- The central `errorHandler` maps: ZodError -> 400 (+errors), Mongoose CastError -> 400 `common.invalidId`, ValidationError -> 400, duplicate key 11000 -> 409 `common.duplicate`, JWT expired -> 401 `auth.tokenExpired`, JWT invalid -> 401 `auth.invalidToken`, bad JSON -> 400, everything else -> 500 (logged).
- Lists use `{ items, pagination: { page, limit, total, totalPages } }` via `utils/pagination.ts` (`limit` max 100):
  ```ts
  const result = await paginate(Banner, { isActive: true }, req.query, { sort: { order: 1 } });
  return sendSuccess(res, 200, 'banner.listFetched', result);
  ```

### i18n
- `Accept-Language: hi` -> Hindi, otherwise English. `req.lang` is `'en' | 'hi'`.
- Message keys are **flat** strings `"<module>.<camelCaseKey>"` in `src/locales/en.json` **and** `src/locales/hi.json` (always add both; Hindi in Devanagari). Interpolation: `"Hello {{name}}"` + `{ name }`.
- In code: `t(req, 'key', params)` or `translate(lang, 'key', params)`. Unknown keys fall back to English, then to the key itself.

### Auth
- App users: `requireAuth` -> `req.user` (Mongoose `UserDocument`), `req.sessionId`. 401 for missing/invalid/expired token or revoked session, 403 if `user.isActive === false`. Session `lastActiveAt` updated at most once a minute.
- Admin: `requireAdmin` verifies a JWT signed with `JWT_ADMIN_SECRET` that has `role: 'admin'` (issue it with `signAdminToken({ sub: adminId })` from `lib/jwt.ts`) and sets `req.admin` (payload). The admin module can add DB checks via `setAdminLoader(async (payload, req) => { ... })`.
- Users: return users to clients with `toPublicUser(user)` from `modules/user/user.model.ts`.
- Push tokens: `Session.fcmToken` (modules/auth/auth.model.ts) — one per user device. The app sends it at verify-otp (`deviceInfo.fcmToken`) and with `PUT /users/me/fcm-token` (login, session restore, token refresh; `null` on logout).
- In-app inbox: `modules/notification` (`notifyUser(userId, payload)` / `notifyAll(payload)` save a `Notification` first, then push). Broadcasts have `userId: null`; read state is a `readBy: [userId]` array on each notification. Use these helpers (not `sendPushToTokens` directly) so every push also shows up in the app.
- Push sending (`src/lib/push.ts`): needs a Firebase service-account key (Firebase console, project `mirai-5d29a` -> Project settings -> Service accounts -> Generate new private key). Save it as `secrets/firebase-service-account.json` (git-ignored) with `FIREBASE_SERVICE_ACCOUNT_PATH=secrets/firebase-service-account.json` (relative to the backend folder, or absolute). Without the file every send answers 503 `admin.pushNotConfigured`. Android notifications use channel `"default"` (created by the app); `data.screen` (e.g. `Horoscope`, `Wallet`) opens that app screen on tap.

### Cache
```ts
import { cache } from '../../lib/cache';
const data = await cache.wrap(`horoscope:daily:${sign}:${date}:${req.lang}`, 6 * 3600, () => divine.daily(sign, date));
await cache.delPattern('horoscope:*');
```
Key format: `<module>:<thing>:<params...>`.

## Adding a module (step by step)

1. Create `src/modules/<name>/` with:
   - `<name>.model.ts` — Mongoose schema + `export const Thing = model('Thing', schema)`; `{ timestamps: true, versionKey: false }`.
   - `<name>.validation.ts` — zod schemas (`createThingSchema`, `listThingsQuery = z.object({ ...paginationQuery })`, `idParam()`), and `z.infer` types.
   - `<name>.service.ts` — business logic; throws `ApiError`; no `req`/`res`.
   - `<name>.controller.ts` — thin: read `req.body/query/params` (already validated), call service, `sendSuccess(...)`.
   - `<name>.routes.ts` — `const router = Router(); router.get('/', validate({ query }), asyncHandler(controller.list)); export default router;`
   - Admin endpoints for the module: a separate `<name>.admin.routes.ts` using `router.use(requireAdmin)`, mounted under `/admin/<name>`.
2. Register in `src/routes/index.ts` — import the router and add **one line** to `moduleRoutes`:
   ```ts
   { path: '/horoscope', router: horoscopeRoutes },
   { path: '/admin/banners', router: bannerAdminRoutes },
   ```
3. Add message keys to **both** `src/locales/en.json` and `src/locales/hi.json` (`"<name>.listFetched": "..."`).
4. New env vars -> `src/config/env.ts` schema + `.env.example`.
5. `npm run typecheck && npm run build`.

## API implemented here

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/health` | - | `{ status, uptime, timestamp, services: { mongodb, redis } }` |
| POST | `/auth/send-otp` | - | `{ email }` -> `{ isNewUser }`; 5 / 15 min per email+IP |
| POST | `/auth/verify-otp` | - | `{ email, otp, hasAcceptedTerms?, deviceInfo:{ deviceId, deviceType: ios\|android\|web, deviceName?, fcmToken? } }` -> `{ accessToken, refreshToken, isNewUser, user }` |
| POST | `/auth/refresh-token` | - | `{ refreshToken }` -> new pair (rotation; reuse of an old refresh token revokes the session) |
| POST | `/auth/logout` | user | `{ deviceId? }` (defaults to current session) |
| POST | `/auth/logout-all` | user | deletes every session |
| GET | `/users/me` | user | `{ user }` |
| PUT | `/users/me` | user | partial profile update -> `{ user }`; `notificationPrefs: { daily?, weekly?, festival?, muhurat? }` (booleans, default true) is merged key by key |
| DELETE | `/users/me` | user | deletes own account: user + all sessions + OTPs + docs with `userId` (wallet Transactions kept) |
| GET | `/users/me/devices` | user | `{ devices: [{ _id, deviceId, deviceType, deviceName, lastActiveAt, isCurrent }] }` |
| DELETE | `/users/me/devices/:sessionId` | user | removes that session |
| PUT | `/users/me/fcm-token` | user | `{ fcmToken: string \| null }` -> sets / clears the push token of the current session (detached from any other session) |
| GET | `/notifications` | user | `?page&limit` (default 20) -> `{ notifications: [{ id, title, body, type, screen, imageUrl, data, createdAt, read }], unreadCount, pagination }`: own + broadcasts sent since sign-up, newest first |
| GET | `/notifications/unread-count` | user | `{ unreadCount }` |
| PATCH | `/notifications/:id/read` | user | -> `{ unreadCount }`; 404 `notification.notFound` |
| PATCH | `/notifications/read-all` | user | -> `{ updated, unreadCount: 0 }` |
| GET | `/horoscope/insights/:topic` | user | topic `career\|finance\|marriage\|health`, `?sign` optional -> `{ topic, sign, personalized, score, today, periods: [{ id: week\|month\|year, title, text }], remedies: [string], basis }`. Own rashi: AI reading from the birth chart (chat getAstroContext + computed topic houses/lords), strict JSON (zod, 1 retry), cached per user+topic+local day+lang. Other sign / no chart / AI failure: that sign's generic daily-yearly text (`personalized: false`). No rashi -> `{ requiresProfileSetup }` |
| POST | `/admin/notifications/run-job` | admin | `{ job: daily\|weekly\|festival\|muhurat, userId?, force?, date? (IST YYYY-MM-DD "as of") }` -> runs a scheduled job now -> `{ job, date, dedupeKey, users, sent, skipped, failed, details: [{ userId, status, reason? }] }` |
| POST | `/chat/sessions` | user | `{ title? }` -> 201 `{ session }` |
| GET | `/chat/sessions` | user | `?page&limit`, newest first -> `{ sessions, pagination }` |
| GET | `/chat/sessions/:id/messages` | user | own session; `?page&limit` (default 50, page 1 = newest) or `?before=<messageId>&limit`; items oldest -> newest -> `{ session, messages, pagination: { page, limit, total, totalPages, hasMore, nextBefore } }` |
| POST | `/chat/sessions/:id/messages` | user | `{ content (1-4000), imageUrls?: http(s)[] (max 4) }` -> 201 `{ userMessage, assistantMessage, quota }`; 20/min/user; 503 `chat.aiNotConfigured` (nothing saved), 502 `chat.aiFailed` (user msg rolled back, charge refunded, question given back), 402 `chat.limitReached` + `data: { requiresPlan: true, quota }` (no free question / plan left), 402 `chat.insufficientBalance` |
| GET | `/chat/quota` | user | `{ freeLimit, freeUsed, freeRemaining, subscription: { id, title, isUnlimited, questionsTotal, questionsUsed, questionsRemaining (null = unlimited), expiresAt, ... } \| null, canAsk }` |
| GET | `/plans` | user | active plans by `sortOrder` -> `{ plans }` (admin-managed via `/admin/plans`) |
| POST | `/plans/:id/purchase` | user | pays from the wallet (`debitWallet`, purpose `plan_purchase`) -> 201 `{ subscription, balance, quota }`; 402 `plan.insufficientBalance` + `data: { balance, price }`; 404 `plan.notFound` |

### Chat (AI astrology guide)
- Provider code lives only in `src/lib/ai.ts` (`generateReply({ system, messages }) -> { text, usage, model }`, `isAiConfigured()`); default provider is Anthropic Claude (`ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL` default `claude-sonnet-5-5`, `CHAT_MAX_TOKENS` 1024). Images are sent as URL image blocks (only on the newest message).
- `AI_PROVIDER=mock` returns canned replies without network (dev/QA only; ignored in production).
- System prompt (`modules/chat/chat.prompt.ts`): MIRAI persona + user profile + **astro data** + last 20 messages. Replies follow `Accept-Language` and mirror the user's language. The AI is told to ground every answer in the astro data and never invent placements.
- Astro data (`getAstroContext` in `chat.integrations.ts`): today's daily horoscope for the user's rashi (`getUserRashi`) with category scores + luck lines, kundli basics (ascendant, moon sign, nakshatra, tithi, yoga…), D1 planet → sign/house/nakshatra/retrograde, and the running Vimshottari mahadasha/antardasha. Fetched in parallel (5 s timeout each, failures skipped, never fails the chat) and cached per user per local day (`chat:astro:<userId>:<date>:<lang>:<profileHash>`; 5 min when a source failed).
- Question allowance (`modules/plan/chatSubscription.service.ts`): `CHAT_FREE_QUESTIONS` (default 1) free questions per user (`User.chatFreeUsed`), then plans bought with `POST /plans/:id/purchase` (`ChatSubscription`: questionsTotal (null = unlimited for `chat_based`/`time_based` or questionCount 0), questionsUsed, startsAt, expiresAt from validityValue/Unit). Each message reserves one question with an atomic conditional `$inc` (free first, then the newest usable plan) and gives it back if the AI fails.
- Error envelopes may carry `data` (`new ApiError(402, 'key', { data })`).
- Plans: `DEFAULT_PLANS` (seeded into an empty collection) match the "Choose Your Plan" design; `scripts/migrate-chat-plans.ts` (idempotent, `--dry-run`) moved existing DBs to them.
- Messages: `{ id, _id, sessionId, role: 'user'|'assistant', content, text, imageUrls, status, model, usage, createdAt, updatedAt }`. Sessions auto-title from the first user message.
- Billing: `CHAT_PRICE_PER_MESSAGE` > 0 debits the wallet (`debitWallet`, purpose `chat`) before the AI call and refunds (`creditWallet`, purpose `refund`) if it fails.

### Festival insight (AI)
- `GET /panchang/festivals/insight?name=<festival>&date=YYYY-MM-DD[&sign=libra]` (user) -> `{ festival, date, rashi, insight: { significance, forYourRashi, dos[3-4], donts[2-3], luckyColor, pujaTip } }`. Code: `modules/panchang/festivalInsight.ts`.
- `rashi` = `sign` query, else `getUserRashi(fullName, dateOfBirth)` (422 `festival.rashiRequired` if neither). One `generateReply` call (strict JSON, zod-validated, one retry on bad JSON), in the request language; cached 30 days as `panchang:festivalInsight:<slug>:<date>:<rashi>:<lang>`.
- Not a chat message: no question quota, no wallet charge. 503 `festival.insightUnavailable` (AI not configured), 502 `festival.insightFailed`.

### Kundli: saved profiles
Every `/kundli/*` endpoint (basic-details, planetary-positions, doshas/*, charts/:chartId, dasha/vimshottari, reports/ascendant, ghata-chakra) accepts an optional `?profileId=<id>`: birth data then comes from that saved profile (own only, 404 `kundli.savedProfileNotFound` otherwise). Without it the user's own profile (plus optional overrides) is used, as before.

| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/kundli/profiles` | user | `{ name, gender: male\|female\|other, dateOfBirth: YYYY-MM-DD, birthTime: HH:mm, birthPlace, lat?, lon? (both or neither; else geocoded), tzone? (5.5), isSelf? }` -> 201 `{ profile }`; summary computed via Divine (502/503 = not saved), 422 `geo.placeNotFound` |
| GET | `/kundli/profiles` | user | newest first -> `{ profiles }` |
| GET | `/kundli/profiles/:id` | user | own only -> `{ profile }` |
| DELETE | `/kundli/profiles/:id` | user | own only -> message only |

Profile: `{ id, _id, name, gender, dateOfBirth, birthTime, birthPlace, lat, lon, tzone, isSelf, summary: { sunSign, moonSign, ascendant, nakshatra }, createdAt, updatedAt }` (summary names in English). Deleted with the account (has `userId`).

### Plans, wallet, support, feedback
| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/plans` | user | active plans by `sortOrder` -> `{ plans }` (4 defaults seeded on first request when the collection is empty) |
| GET | `/wallet` | user | `{ balance, balanceText, currencySymbol, lastRechargeAt, lastRechargeText, quickRechargeOptions[], paymentMethods[], trustBadges[] }` |
| GET | `/wallet/transactions` | user | `?type=all\|recharge\|usage&page&limit(20)` -> `{ balance, groups: [{ key, label, transactions }], pagination }`; IST day groups ("Today"/"Yesterday"/"12 Mar 2026") |
| POST | `/wallet/recharge` | user | `{ amount: int 1..100000, paymentMethod: upi\|card\|netbanking, cardLast4? }` (simulated success) -> 201 `{ balance, transaction }` |
| POST | `/wallet/debit` | user | `{ amount, purpose, title, description? }` -> 201 `{ balance, transaction }`; 400 `wallet.insufficientBalance` |
| POST/GET | `/support`, `/support/:id` | user | create `{ subject, description, category?, priority? }` or app dispute `{ issueType, description }` -> `{ ticket }`; list own `{ tickets, pagination }` |
| POST | `/feedback` | user | `{ rating 1-5, message? \| thoughts? }` -> 201 `{ feedback, promptStoreReview }` |
| GET/POST/GET/PATCH(PUT)/DELETE | `/admin/plans[/:id]` | admin | list `{ plans, total, page, totalPages }` (default limit 100); item `{ plan }` |
| GET | `/admin/transactions[/:id]` | admin | `?page&limit&search&type&status&purpose&userId` -> `{ orders, total, page, totalPages, summary }`, `userId: { id, fullName, email }`; detail `{ transaction, order }` |
| GET/PUT(PATCH) | `/admin/support[/:id]` | admin | `?page&limit&status&priority&category&search` -> `{ tickets, total, totalPages, stats }`; detail/update return the ticket **directly** in `data`; `user` is never null |
| GET | `/admin/feedback` | admin | `?page&limit&rating&search` -> `{ feedback, total, totalPages, stats: { averageRating, totalRatings, distribution } }` |

- Ledger: `Transaction` (`modules/wallet/transaction.model.ts`); balance is `User.walletBalance`, changed only with atomic `$inc` (debits are conditional on `$gte`, so it never goes negative).
- For other modules: `debitWallet(userId, { amount, purpose, title, description?, referenceId?, planId? })`, `creditWallet(userId, { ..., paymentMethod?, paymentRef? })`, `getBalance(userId)` from `modules/wallet/wallet.service.ts`.
- Every plan/transaction/ticket/feedback document carries both `id` and `_id` (`utils/idTransform.ts`).

### Admin panel core, banners, CMS, FAQ, media

| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/admin/login` | - | `{ email, password }` -> `{ token, accessToken, user, admin }` (user = `{ id, _id, name, fullName, email, role, isActive, lastLoginAt }`). Bad credentials = **400** (never 401) |
| POST | `/admin/forgot-password` | - | `{ email }`; emails a 6-digit OTP (logged when SMTP is off / fails in dev). Always 200 |
| POST | `/admin/verify-otp` | - | `{ email, otp }` -> `{ verified: true }`; bad OTP = 400 (`DEV_FIXED_OTP` accepted outside production) |
| POST | `/admin/reset-password` | - | `{ email, otp, password \| newPassword }`; invalidates admin tokens issued earlier |
| GET | `/admin/profile` | admin | `{ admin, user }` |
| GET | `/admin/dashboard/stats` | admin | `{ totalUsers, activeUsers, profileCompleteUsers, activePercentage (0-100), inactiveUsers, profileCompletePercentage, newUsersToday, newUsersLast7Days, newUsersLast30Days, activeSessions24h, dailyActiveUsers, monthlyActiveUsers, userGrowth: [{ date, count }] (30d), revenue?: { currency, total, today, last30Days, transactions, daily: [{ date, amount }] } }` (revenue = successful wallet recharges) |
| DELETE | `/admin/cache/flush` | admin | `?pattern=horoscope:*` -> `{ pattern, deleted }`; no pattern = flush all |
| GET | `/admin/users` | admin | no params -> **all** users; optional `?page&limit&search&isActive&isProfileComplete` -> `{ users, total, pagination }`; user = public user + `id`, `name`, `status` |
| GET/PATCH(PUT)/DELETE | `/admin/users/:userId` | admin | PATCH whitelists fields (accepts panel aliases, capitalised gender, `status`/`active`/`disabled`); deactivating revokes all sessions; DELETE removes user + sessions + docs with `userId` (Transactions kept) |
| POST | `/admin/users/test-notification` (or `/admin/users/:userId/test-notification`) | admin | `{ userId, title, body, imageUrl?, screen?, data? }` (`screen` -> `data.screen`) -> saved in the user's in-app inbox (`Notification`), then FCM to every Session.fcmToken (invalid tokens pruned); 503 if `FIREBASE_SERVICE_ACCOUNT_PATH` unset |
| POST | `/admin/users/broadcast-notification` | admin | `{ title, body, imageUrl?, screen?, data? }` -> one broadcast `Notification` (userId null, every user's inbox) + FCM to every active user's devices. 503 `admin.pushNotConfigured` (with `data.saved: true`) while Firebase is not configured |
| GET/POST/GET/PUT(PATCH)/DELETE | `/admin/banners[/:id]` | admin | list `{ banners, total }` sorted by `order`; item `{ banner }`. Fields: `title`, `subtitle`, `buttonText` (default "View Today"), `imageUrl` (absolute URL or relative `/uploads/...`), `link`, `isActive`, `order` |
| GET | `/banners` | - | active banners by `order` -> `{ banners }` |
| GET | `/cms?type=terms\|privacy\|about` | - | `{ cms }` (active only) |
| GET/GET/POST/PUT(PATCH)/DELETE | `/admin/cms[/:id]` | admin | list = **bare array** in `data`; item returned directly in `data`; POST upserts by `type` |
| GET | `/faq` | - | `{ faqs }` (active, by `order`) |
| GET/GET/POST/PUT(PATCH)/DELETE | `/admin/faq[/:id]` | admin | list = **bare array** in `data` (by `order`); item returned directly in `data` |
| POST | `/media/upload` | user or admin | multipart `images` (1-5, 5MB each, jpeg/png/webp/gif/heic, magic bytes checked) -> 201 `{ urls, paths, files: [{ url, path, key, originalName, mimeType, size, storage }] }` (`path` = relative `/uploads/...` for local storage, same as `url` on S3) |
| POST | `/media/public-upload` | - | same, 10 req / 15 min / IP |

- Storage: S3 when `AWS_S3_BUCKET` + `AWS_REGION` are set, else `./uploads` served at `/uploads/...` (absolute URLs from `PUBLIC_BASE_URL`).
- Startup (`modules/admin/admin.bootstrap.ts`): registers the `requireAdmin` DB check and seeds the first super admin (`ADMIN_SEED_EMAIL`/`ADMIN_SEED_PASSWORD`, only if no admin exists), default CMS pages and FAQs (only if missing), and the default "Know Your Stars" banner when the banners collection is empty (copies `assets/seed/know-your-stars.png` to `uploads/banners/`, stores the relative `/uploads/banners/know-your-stars.png`).
- Banner/CMS/FAQ/Admin docs carry both `id` and `_id` (`utils/mongooseJson.ts`). Push helper: `lib/push.ts`.

Tokens: access JWT `{ sub: userId, sid: sessionId, type: 'access' }` (1d); refresh JWT `{ sub, sid, jti, type: 'refresh' }` (30d), only its SHA-256 hash is stored on the Session.
