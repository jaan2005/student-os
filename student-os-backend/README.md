# Student OS — Backend (Auth API)

Express + MongoDB Atlas + Firebase Admin SDK + JWT. Verifies Firebase-authenticated
users and issues the session JWT the frontend uses for every subsequent request.

## Setup

```bash
npm install
cp .env.example .env
```

Fill in `.env`:

1. **MONGODB_URI** — your MongoDB Atlas connection string.
2. **JWT_SECRET** — any long random string (e.g. `openssl rand -hex 32`).
3. **Firebase Admin credentials** — from Firebase Console → Project Settings →
   Service Accounts → "Generate new private key". Either:
   - paste the whole downloaded JSON as one line into `FIREBASE_SERVICE_ACCOUNT`, or
   - split it into `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`
     (keep the `\n` sequences in the private key literal — the code converts them back).
4. **Cloudinary credentials** — from [cloudinary.com](https://cloudinary.com) console
   → Dashboard → copy `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`.
   Used to store uploaded notes/resources (PDFs, docs, slides, images).

Run it:

```bash
npm run dev      # nodemon, auto-restarts
npm start        # plain node
```

Server starts on `http://localhost:5000` (or `PORT` from `.env`).

## API

| Method | Route               | Auth              | Purpose                                                        |
|--------|----------------------|-------------------|------------------------------------------------------------------|
| GET    | `/api/health`         | none               | Liveness check                                                  |
| POST   | `/api/auth/sync`      | Firebase ID token in body | Verifies the Firebase user, creates the Mongo user if new, returns a JWT |
| GET    | `/api/users/me`       | Bearer JWT         | Returns the current user's profile; also used to validate a stored JWT |
| PUT    | `/api/users/profile`  | Bearer JWT         | Saves Profile Setup fields, marks `profileCompleted: true`      |
| GET    | `/api/resources`       | Bearer JWT         | List/search/filter/sort resources (`search`, `semester`, `subject`, `fileType`, `sort`, `page`, `limit`, `ids`) |
| POST   | `/api/resources/upload`| Bearer JWT         | Multipart upload (`file` + metadata fields); dedups by SHA-256 hash before touching Cloudinary |
| GET    | `/api/resources/:id`   | Bearer JWT         | Resource detail; pass `?download=true` to increment the downloads counter |
| PUT    | `/api/resources/:id`   | Bearer JWT, owner  | Edit resource metadata (not the file itself)                     |
| DELETE | `/api/resources/:id`   | Bearer JWT, owner  | Deletes the resource, its Cloudinary asset, and any bookmarks of it |
| GET    | `/api/subjects`        | Bearer JWT         | Folder-card data: resources grouped by Semester → Subject (note: mounted under `/api` for consistency, unlike the bare `/subjects` in the original spec) |
| GET    | `/api/bookmarks`       | Bearer JWT         | The current user's bookmarked resources                          |
| POST   | `/api/bookmarks/:id`   | Bearer JWT         | Bookmark a resource by its id (idempotent)                       |
| DELETE | `/api/bookmarks/:id`   | Bearer JWT         | Remove a bookmark by resource id (idempotent)                    |
| GET    | `/api/admin/users`     | Bearer JWT, admin  | List/search all users (`?search=`)                                |
| PATCH  | `/api/admin/users/:id/role` | Bearer JWT, admin | Change a user's role (`{ "role": "..." }`)                  |
| POST   | `/api/ai/explain`      | Bearer JWT         | `{ resourceId, inputText }` → structured explanation. Always live, 1 credit. |
| POST   | `/api/ai/summarize`    | Bearer JWT         | `{ resourceId }` → structured summary of a PDF resource. Instant + free if pre-generated (see below); otherwise live, 1 credit. |
| POST   | `/api/ai/quiz`         | Bearer JWT         | `{ resourceId, source: 'entire_pdf'\|'topic', topic? }` → 10 MCQ + 5 short-answer. `entire_pdf` is instant + free if pre-generated; `topic` is always live, 1 credit. |

## Roles & permissions

Three roles, stored on `User.role`: `student` (default), `trustedContributor`, `admin`.

| Action | student | trustedContributor | admin |
|---|---|---|---|
| View / download / bookmark / search | ✅ | ✅ | ✅ |
| Upload resources | ❌ | ✅ (up to `MAX_MONTHLY_UPLOADS`/month) | ✅ (unlimited) |
| Edit / delete own resources | — | ✅ | ✅ |
| Edit / delete **any** resource | — | ❌ | ✅ |
| Manage users / change roles | ❌ | ❌ | ✅ |

**All of this is enforced server-side**, in `middleware/authorizeRoles.js` on
the routes and with explicit ownership/role checks inside the resource
controller — the frontend hiding an Upload button for students is a UX
nicety, not the actual security boundary. A request forged straight against
the API with a student's JWT still gets a `403`.

**Monthly upload quota**: `MAX_MONTHLY_UPLOADS` (default 10, configurable via
env, see `.env.example`) applies only to `trustedContributor` — admins are
unlimited. `User.monthlyUploadCount` / `uploadResetDate` track it;
`utils/monthlyUploads.js` resets the count as soon as a new calendar month is
detected, checked both on every `GET /api/users/me` (so the number self-heals
even before the user's next upload attempt) and at the top of the upload
flow. **Duplicate uploads never increment the count** — the hash check happens
before the quota would otherwise apply, matching the spec's exact ordering
(JWT → role → monthly count → hash).

**Bootstrapping the first admin**: every new user starts as `student`, and
role changes normally happen through the admin panel — which itself requires
an existing admin. Break that chicken-and-egg problem once, after signing up
normally through the app:
```bash
npm run promote-admin -- someone@example.com
```

### `POST /api/resources/upload`

Requires `trustedContributor` or `admin` role — students get a `403` with
`"You are not authorized to upload resources."` before Multer even parses
the file. Trusted Contributors are also capped at `MAX_MONTHLY_UPLOADS`/month
(admins unlimited); hitting the cap returns `403` with
`"You have reached your monthly upload limit."`

`multipart/form-data` with a `file` field plus: `title`, `description`, `semester`, `subject`, `unit`, `topic`, `tags` (comma-separated).

Allowed types: PDF, DOC, DOCX, PPT, PPTX, JPG, PNG. Max size: 20 MB (rejected
with `"This file exceeds the maximum upload size of 20 MB."`). Anything else
(zip, rar, apk, exe, iso, mp4, mov, ...) is rejected by MIME type, not by file
extension, so it can't be spoofed by renaming a file.

Response is one of:
```json
{ "status": "success", "resource": { ... } }
```
```json
{ "status": "duplicate", "resource": { ... an already-existing resource ... } }
```
A duplicate response means a file with the exact same bytes was already
uploaded — nothing new was written to Cloudinary or MongoDB.

### `POST /api/auth/sync`
```json
// request
{ "idToken": "<firebase-id-token>" }

// response
{
  "token": "<backend-jwt>",
  "isNewUser": true,
  "user": {
    "id": "...", "email": "...", "provider": "password",
    "firstName": "", "lastName": "", "college": "", "branch": "", "semester": "",
    "profileCompleted": false
  }
}
```

## Two-token model

- **Firebase ID token** — proves identity to *this backend*, once, right after
  sign-in/sign-up. It's short-lived and only ever sent to `/api/auth/sync`.
- **Backend JWT** — what the SPA stores and sends as `Authorization: Bearer <jwt>`
  on every other request (`/api/users/me`, `/api/users/profile`, and anything
  added later). Keeps the rest of the API decoupled from Firebase Admin calls.

## Data model (`User`)

```
firebaseUid, email, provider ('password' | 'google'),
firstName, lastName, college, branch, semester,
profileCompleted,
role ('student' | 'trustedContributor' | 'admin'), default 'student',
monthlyUploadCount, uploadResetDate,
dailyCredits, lastCreditReset,
createdAt, updatedAt
```

## Data model (`Resource`)

```
title, description, semester, subject, unit, topic, tags[],
resourceType ('pdf'|'doc'|'docx'|'ppt'|'pptx'|'jpg'|'png'),
fileName, fileSize, fileHash (unique index — see dedup below),
cloudinaryUrl, cloudinaryPublicId,
uploadedBy (ref User), downloads, bookmarks (cached count),
extractedText (select: false — cached PDF text for AI features),
aiPregenStatus ('pending'|'ready'|'unsupported'|'failed'),
aiSummaryCache, aiQuizCache (select: false — see AI pre-generation below),
aiPregenAt,
createdAt, updatedAt
```

Indexes: unique on `fileHash`; text index across `title`/`description`/`subject`/`unit`/`topic`/`tags`; compound `{ semester, subject }` for folder-card aggregation.

## Data model (`Bookmark`)

```
user (ref User), resource (ref Resource), createdAt, updatedAt
```
Unique compound index on `{ user, resource }` — a user can't double-bookmark the same resource, and this is enforced at the database level, not just in application code.

## Duplicate file detection

Every upload is hashed (SHA-256, over the raw bytes) before it's sent to
Cloudinary. If a `Resource` with that `fileHash` already exists, the request
returns that existing resource with `status: 'duplicate'` and nothing new is
uploaded. The unique index on `fileHash` is what actually prevents two
identical files from ever coexisting — even if two people upload the same
file at the same instant, the second `Resource.create()` call fails with a
Mongo duplicate-key error, and the controller catches that, deletes the
Cloudinary asset it just (redundantly) uploaded, and returns the winning
resource instead.

## Cloudinary resource_type: images vs. documents

Images (`jpg`/`png`) upload as Cloudinary `resource_type: 'image'`; PDFs and
Office documents upload as `'raw'` (see `utils/cloudinaryResourceType.js`).
This matters for two reasons:

1. **It avoids Cloudinary's PDF/ZIP delivery restriction.** Cloudinary
   accounts by default block public delivery of PDFs served through the
   `/image/upload/...` pipeline (a security default, since PDFs can embed
   scripts) — that shows up as an `HTTP 401` when opening the file. Uploading
   as `raw` serves it through `/raw/upload/...` instead, which isn't subject
   to that restriction, so no Cloudinary dashboard setting needs to change.
2. **Deleting a resource requires the exact `resource_type` it was uploaded
   under.** `'auto'` is only valid for uploads, not for `cloudinary.uploader.destroy()`.
   Using it there fails silently (the call is wrapped in `.catch(() => {})`
   so it doesn't block the Mongo delete) — meaning the file would never
   actually be removed from Cloudinary storage. Both `deleteResource` and the
   duplicate-upload race-condition cleanup path use the same
   `getCloudinaryResourceType()` helper the upload path used, so this always
   matches.
3. **It defaults delivery to `Content-Disposition: attachment`**, which means
   the browser downloads a `raw`-type file the instant anything requests its
   URL — including an `<iframe>` trying to preview it. `sanitizeResource`
   therefore returns three URLs, each for a distinct purpose:
   - `cloudinaryUrl` — the underlying stored asset URL. Not meant to be used
     directly by the frontend for either previewing or downloading anymore
     (see the two below); kept mainly as a fallback and for reference.
   - `previewUrl` — same file, with `fl_attachment:false` inserted (see
     `utils/cloudinaryUrls.js`), used only by the frontend's `PDFViewer` and
     the "Preview" button. Using `cloudinaryUrl` here is exactly what causes
     "clicking Open just downloads the file instead of previewing it."
   - `downloadUrl` — same file, with `fl_attachment:<real filename>`
     inserted, used only by Download buttons. Cloudinary's *default*
     attachment behavior (i.e. what plain `cloudinaryUrl` gives you) reports
     the filename as the raw SHA-256 `public_id` with no explicit
     Content-Disposition filename — desktop browsers are generally forgiving
     and infer `.pdf` from the URL path anyway, but Android's download
     manager leans more heavily on the actual Content-Disposition header;
     with none given, it can save the file with no recognizable name or
     extension, which is what "it downloads but nothing can open it" on
     mobile looks like. `fl_attachment:<filename>` makes Cloudinary set an
     explicit, correctly-named Content-Disposition instead.

## AI Learning Module

Three JWT-protected endpoints, all backed by Google Gemini
(`services/geminiService.js`) via structured JSON output (`responseSchema`),
so responses always match the exact shape the frontend expects rather than
needing to be parsed out of free-form text.

**Daily credits.** Every user gets `DAILY_AI_CREDITS` (default 10, env-configurable)
credits per calendar day, shared across all three features (1 credit each).
`utils/dailyCredits.js` resets the count the same way `utils/monthlyUploads.js`
resets the upload quota — checked on every `GET /api/users/me` (self-heals
even before the user's next AI request) and at the top of each AI controller.

**Credits are deducted only after a successful Gemini response — and this is
now race-safe under concurrency.** Each controller calls `reserveCredits()`
*before* attempting the Gemini call: an atomic MongoDB
`findOneAndUpdate({ dailyCredits: { $gte: cost } }, { $inc: { dailyCredits: -cost } })`
that checks-and-decrements in one operation. If the Gemini call then fails,
`refundCredits()` gives the credit back — so the net effect still satisfies
"deduct only on success," while the reservation itself can't be
double-spent by two near-simultaneous requests the way a plain
read-then-`save()` could be (see "Why the credit check is atomic" below for
the concurrency bug this replaced).

**Why the credit check is atomic, not read-then-write.** An earlier version
of this code checked `user.dailyCredits >= cost` in application code, then
separately decremented and saved. That has a real race condition: if the
same user fires two requests close enough together, both can read the same
"I have enough credits" state before either write lands — since a single
Gemini call takes several seconds, that window is wide enough to matter, not
just theoretical. `reserveCredits()`/`refundCredits()` in `utils/dailyCredits.js`
fix this by pushing the check-and-decrement into a single atomic database
operation: MongoDB itself guarantees only one of two racing requests can
match `{ dailyCredits: { $gte: cost } }` and decrement — the other gets
`null` back, meaning "insufficient credits," not a database error.

**AI Summarize and AI Quiz (entire-PDF mode) only support PDF resources in
V1.** `utils/extractResourceText.js` extracts text via `pdf-parse`; DOC/DOCX/PPT/PPTX
would need a conversion step (e.g. LibreOffice) and JPG/PNG would need OCR,
both out of scope for this pass — requesting either feature on a non-PDF
resource returns a clear `400` explaining this, and suggests using Explain
with a manually entered topic instead (which works for any resource type,
since it doesn't depend on file content at all). Extracted text is cached
on the `Resource` document (`extractedText`, `select: false` so it doesn't
bloat normal queries) so repeat Summarize/Quiz requests on the same resource
don't re-fetch and re-parse the PDF.

**"Highlight text to explain" — a real, documented limitation.** The spec
calls for explaining either a manually typed topic or text highlighted
inside the PDF preview. The Resource Details page renders PDFs via Google's
document viewer in a cross-origin `<iframe>` (see the frontend's
`PDFViewer.jsx` / `lib/previewUrl.js` — this was a deliberate earlier fix for
Cloudinary forcing downloads instead of inline preview). A cross-origin
iframe's DOM, including any text selection inside it, is not readable by the
parent page — that's a browser security boundary, not a bug. So true
in-PDF-highlight capture isn't wired up: the frontend's Explain input
instead accepts pasted text, which is functionally identical to this
endpoint (`inputText` is just a string either way) — a user can still select
text in the preview, copy it, and paste it into the Explain box. Wiring up
real highlight-to-explain later would require switching to a same-origin
PDF renderer (e.g. `pdf.js` rendered directly rather than proxied through
Google's viewer) — a separate, larger change, not an extension of this
module.

**Extensibility.** Every AI call is already resource-scoped (`resourceId` is
required on all three endpoints), so the same pattern — reserve credits →
Gemini call → refund on failure — extends directly to Flashcards, AI Chat,
Discussions, or Study Roadmaps without restructuring anything: add a new
cost to `AI_CREDIT_COSTS`, a new prompt/schema pair to `geminiService.js`,
and a new controller function following the same shape.

## AI pre-generation (Summary + whole-PDF Quiz on upload)

**The problem this solves:** without it, every student's first click on
Summarize/Generate-Quiz-from-entire-PDF is a live Gemini call. If many
students open the same popular file around the same time — the realistic
case for this app being a resource shared with an entire class before an
exam — that's many simultaneous Gemini calls for what is, from the AI's
perspective, the exact same request. Gemini's own rate limits (not MongoDB,
which handles concurrent reads fine) are the actual bottleneck that could
make the feature slow or fail under that load.

**The fix:** generate the Summary and whole-PDF Quiz once, right after
upload, and cache them on the `Resource` document
(`aiSummaryCache`/`aiQuizCache`, both `select: false`, plus `aiPregenStatus`:
`'pending' | 'ready' | 'unsupported' | 'failed'`). From then on, every
student's Summarize/Quiz-from-entire-PDF request is answered straight from
that cached field — a plain MongoDB read, no Gemini call, no matter how many
students hit it at once.

- **Triggered in `resourceController.uploadResource`**, after the upload
  response has already been sent — the uploader never waits on this. Only
  for `resourceType === 'pdf'`; everything else is marked `'unsupported'`
  immediately rather than sitting at `'pending'` forever.
- **Queued, not run inline**, via `utils/aiPregenQueue.js` (a `TaskQueue`
  instance capped at `AI_PREGEN_CONCURRENCY`, default 2) — so several
  uploads in quick succession don't each fire a Gemini call simultaneously.
  This is intentionally a simple in-process queue with no persistence or
  crash-retry, which is fine for a single-server deployment; if this ever
  needs to survive a restart or scale across multiple servers, that's the
  point to graduate to a real job queue (e.g. BullMQ + Redis) rather than
  extend this further.
- **Not charged against any user's daily AI credits** — it's a platform
  cost tied to the upload itself, not a student action.
- **Falls back gracefully.** If pre-generation fails, hasn't run yet, or the
  resource predates this feature, `aiController.summarize`/`quiz` fall
  through to the normal live path (which *does* cost a credit, and caches
  its own result afterward for next time) — nothing breaks, it's just not
  instant for that one resource until it's cached.

**Backfilling resources uploaded before this feature existed** — including
anything your teachers upload before this ships:
```bash
npm run backfill-ai
```
Finds every PDF resource not yet marked `'ready'` and generates its Summary
and Quiz, one at a time. Safe to re-run.

## AI rate limiting

Separate from the daily credit system, and solving a different problem:
credits limit *how much* AI a student can use per day; the rate limiter
(`middleware/rateLimiter.js`, applied to the whole `/api/ai` router) limits
*how fast* they can fire requests — `AI_RATE_LIMIT_MAX` requests (default 8)
per `AI_RATE_LIMIT_WINDOW_MINUTES` (default 1), keyed per-user. This is a
safety net against a runaway client bug or a script hammering the endpoint
faster than any real click ever would, which could rack up real Gemini
costs in a burst before the credit count even catches up — normal usage
(click a button, read the result, click again later) never comes close to
this limit.

`MAX_EXPLAIN_INPUT_CHARS` (default 8000) similarly bounds the cost of a
single Explain request regardless of credit accounting — enforced
server-side, with matching client-side feedback in `ExplainPanel.jsx` so a
student sees the limit before submitting, not just after.
