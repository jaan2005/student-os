# Student OS — Backend

Express + MongoDB Atlas + Firebase Admin SDK + JWT + Cloudinary + Google Gemini.
Verifies Firebase-authenticated users, issues the session JWT the frontend uses
for every request, stores/serves study resources, and powers the AI Learning
Module (Explain / Summarize / Quiz / Study Assistant).

This README covers the full app as it stands today — V1 (auth, Notes &
Resources, AI Explain/Summarize/Quiz) plus everything added in V2
(multi-college support, Career Resources, AI Study Assistant chat).

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
5. **GEMINI_API_KEY** — from [aistudio.google.com/apikey](https://aistudio.google.com/apikey).
   Powers Explain / Summarize / Quiz / AI Study Assistant.

Everything else in `.env.example` has a sensible fallback if left unset —
see the comments above each variable there for what it controls.

Run it:

```bash
npm run dev      # nodemon, auto-restarts
npm start        # plain node
```

Server starts on `http://localhost:5000` (or `PORT` from `.env`).

## One-time setup scripts

```bash
# Promote the first admin (every new user starts as 'student' — this
# breaks the chicken-and-egg problem of needing an admin to create an admin)
npm run promote-admin -- someone@example.com

# Backfill category/college onto resources uploaded before V2. Run this
# ONCE after deploying V2 against a database that has existing data —
# otherwise every pre-V2 resource silently disappears from every student's
# Notes & Resources view (see "Migrating to V2" below).
npm run backfill-college
```

## What's new in V2

- **Multi-college support** — `ALLOWED_COLLEGES` is now a real list, not a
  single hardcoded string. Notes & Resources is scoped per-college: a
  student only ever sees, searches, and uploads within their own college's
  resources.
- **Career Resources** — a second resource category, visible to every
  student regardless of college, with a manual admin-approval queue before
  anything goes live. Upload access is a separate, admin-granted permission
  from the academic `trustedContributor` role.
- **AI Study Assistant** — a real chat, scoped to one PDF resource at a
  time, with persistent conversation history. Same credit/rate-limit safety
  nets as Explain/Summarize/Quiz, applied per message.

## API

| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| GET | `/api/health` | none | Liveness check |
| POST | `/api/auth/sync` | Firebase ID token in body | Verifies the Firebase user, creates the Mongo user if new, returns a JWT |
| GET | `/api/users/me` | Bearer JWT | Returns the current user's profile; also used to validate a stored JWT |
| PUT | `/api/users/profile` | Bearer JWT | Saves Profile Setup fields (including `college`, validated against `ALLOWED_COLLEGES`), marks `profileCompleted: true` |
| GET | `/api/resources` | Bearer JWT | List/search/filter/sort resources. `category` (`academic`\|`career`, default `academic`), `search`, `semester`, `subject`, `fileType`, `sort`, `page`, `limit`, `ids`. Academic is always scoped to the caller's college; career always shows approved items plus the caller's own pending/rejected ones |
| POST | `/api/resources/upload` | Bearer JWT | Multipart upload (`file` + metadata, including `category`); dedups by SHA-256 hash before touching Cloudinary. Authorization branches by category — see Roles & permissions |
| GET | `/api/resources/:id` | Bearer JWT | Resource detail — 404s (not 403) if the resource is outside the caller's college/approval visibility, so a guessed id can't confirm existence |
| GET | `/api/resources/:id/download` | Bearer JWT | Streams the file with a correct `Content-Type`/`Content-Disposition`; increments the downloads counter |
| PUT | `/api/resources/:id` | Bearer JWT, owner | Edit resource metadata (not the file itself) |
| DELETE | `/api/resources/:id` | Bearer JWT, owner | Deletes the resource, its Cloudinary asset, any bookmarks, and any AI Study Assistant conversations tied to it |
| GET | `/api/subjects` | Bearer JWT | Folder-card data: academic resources grouped by Semester → Subject, scoped to the caller's college |
| GET | `/api/bookmarks` | Bearer JWT | The current user's bookmarked resources |
| POST | `/api/bookmarks/:id` | Bearer JWT | Bookmark a resource by its id (idempotent) |
| DELETE | `/api/bookmarks/:id` | Bearer JWT | Remove a bookmark by resource id (idempotent) |
| GET | `/api/admin/users` | Bearer JWT, admin | List/search all users (`?search=`) |
| PATCH | `/api/admin/users/:id/role` | Bearer JWT, admin | Change a user's role (`{ "role": "..." }`) |
| PATCH | `/api/admin/users/:id/career-access` | Bearer JWT, admin | Grant/revoke Career Resources upload access (`{ "canUploadCareer": true }`) — independent of `role` |
| GET | `/api/admin/career-resources/pending` | Bearer JWT, admin | The approval queue: every Career Resource still awaiting a decision, oldest first |
| PATCH | `/api/admin/career-resources/:id/approve` | Bearer JWT, admin | Approves a pending Career Resource |
| PATCH | `/api/admin/career-resources/:id/reject` | Bearer JWT, admin | Rejects a pending Career Resource |
| POST | `/api/ai/explain` | Bearer JWT | `{ resourceId, inputText }` → structured explanation. Always live, 1 credit |
| POST | `/api/ai/summarize` | Bearer JWT | `{ resourceId }` → structured summary of a PDF resource. Instant + free if pre-generated; otherwise live, 1 credit |
| POST | `/api/ai/quiz` | Bearer JWT | `{ resourceId, source: 'entire_pdf'\|'topic', topic? }` → 10 MCQ + 5 short-answer. `entire_pdf` is instant + free if pre-generated; `topic` is always live, 1 credit |
| GET | `/api/ai/assistant/:resourceId` | Bearer JWT | Returns the caller's active conversation for this PDF resource (creating an empty one if none exists — free, no credit spent until a message is sent) plus its messages |
| POST | `/api/ai/assistant/:resourceId/new` | Bearer JWT | Archives the current active conversation and starts a fresh one ("New Chat") |
| POST | `/api/ai/assistant/:conversationId/message` | Bearer JWT | `{ content }` → sends a message, returns the user + assistant message pair. 1 credit per message, same reserve/refund flow as the other AI features |

## Roles & permissions

Three roles, stored on `User.role`: `student` (default), `trustedContributor`, `admin`.

| Action | student | trustedContributor | admin |
|---|---|---|---|
| View / download / bookmark / search academic resources (own college) | Yes | Yes | Yes |
| Upload academic resources | No | Yes (up to `MAX_MONTHLY_UPLOADS`/month) | Yes (unlimited) |
| View approved Career Resources (any college) | Yes | Yes | Yes |
| Upload Career Resources | only if `canUploadCareer` is granted | only if `canUploadCareer` is granted | Yes (always, auto-approved) |
| Approve/reject Career Resources | No | No | Yes |
| Edit / delete own resources | -- | Yes | Yes |
| Edit / delete **any** resource | -- | No | Yes |
| Manage users / change roles / grant career access | No | No | Yes |

**All of this is enforced server-side** — in `middleware/authorizeRoles.js` for
academic uploads and admin routes, and inside `resourceController.authorizeUpload()`
for the category-branching upload check — never just a hidden frontend button.
A request forged straight against the API with a student's JWT still gets a `403`.

**Career access is a permission flag, not a role.** `User.canUploadCareer` is
independent of `role` — a plain student can be granted it (e.g. a placement-
committee member who isn't an academic `trustedContributor`), and a
`trustedContributor` doesn't get it automatically. Admins can always upload
Career Resources regardless of the flag, and their uploads are auto-approved
(they're the ones who'd otherwise approve it).

**Monthly upload quota** applies only to academic uploads by `trustedContributor`
(admins unlimited; Career Resources aren't subject to it at all — it's a
moderation gate, not a volume limit). `User.monthlyUploadCount` /
`uploadResetDate` track it; `utils/monthlyUploads.js` resets the count as soon
as a new calendar month is detected. **Duplicate uploads never increment the
count** — the hash check happens before the quota would otherwise apply.

**Bootstrapping the first admin** — see "One-time setup scripts" above.

### `POST /api/resources/upload`

`multipart/form-data` with a `file` field plus metadata, including `category`
(`academic` | `career`, defaults to `academic` if omitted).

- **Academic**: requires `title`, `semester`, `subject`. Requires
  `trustedContributor`/`admin` role. Subject to the monthly quota.
- **Career**: requires `title`, `description`. Requires `canUploadCareer` or
  `admin`. Not subject to the monthly quota. Starts `approvalStatus: 'pending'`
  unless the uploader is an admin.

Allowed types: PDF, DOC, DOCX, PPT, PPTX, JPG, PNG. Max size: 20 MB. Anything
else is rejected by MIME type, not file extension, so it can't be spoofed by
renaming a file.

Response is one of:
```json
{ "status": "success", "resource": { ... } }
```
```json
{ "status": "duplicate", "resource": { ... an already-existing resource ... } }
```

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
    "profileCompleted": false, "role": "student", "canUploadCareer": false
  }
}
```

## Two-token model

- **Firebase ID token** — proves identity to *this backend*, once, right after
  sign-in/sign-up. Short-lived, only ever sent to `/api/auth/sync`.
- **Backend JWT** — what the SPA stores and sends as `Authorization: Bearer <jwt>`
  on every other request. Keeps the rest of the API decoupled from Firebase
  Admin calls after login.

## Multi-college & Career Resources

`ALLOWED_COLLEGES` (in `config/constants.js`) is the server-side source of
truth for which colleges a student can select in Profile Setup — must stay in
sync with `COLLEGES` in the frontend's `src/constants/colleges.js`. Adding a
new college is a one-line addition to that array; no schema change needed.

Every `Resource` has:
- `category`: `'academic'` (scoped to `college`, unchanged V1 behavior) or
  `'career'` (cross-college, approval-gated).
- `college`: set for academic resources, `null` for career.
- `approvalStatus`: `'approved'` | `'pending'` | `'rejected'`. Academic
  resources are always `'approved'` — no moderation step, same as V1. Career
  resources start `'pending'` (unless uploaded by an admin) and are invisible
  to everyone except the uploader and admins until approved.

**Visibility is enforced on every access path, not just list queries** — a
direct `GET /api/resources/:id` (or download) with a guessed/leaked id is
checked against the same rule (`resourceController.canViewResource`), and
returns `404` rather than `403` so it doesn't confirm to an unauthorized
caller that a given id exists.

### Migrating to V2

If you're deploying V2 against a database that already has resources from
before this release: **run `npm run backfill-college` once**, after
deploying, before anyone uses the app. Pre-V2 resources have no `category`/
`college` set — without the backfill, they'd have `college: null`, which
never matches a real college string, and would silently vanish from every
student's Notes & Resources view. The script is safe to re-run (it only
touches documents where `college` is still unset).

## AI Learning Module

Four JWT-protected features, all backed by Google Gemini (`services/geminiService.js`).

**Explain, Summarize, Quiz** use structured JSON output (`responseSchema`), so
responses always match the exact shape the frontend expects. **AI Study
Assistant** returns free-form conversational text instead — a chat reply
isn't a fixed schema.

**Daily credits.** Every user gets `DAILY_AI_CREDITS` (default 10) credits per
calendar day, shared across all four features. Explain/Summarize/Quiz cost 1
credit per use; the Assistant costs 1 credit **per message**, not per
conversation — a 10-message chat costs the same as clicking Explain 10 times
would. `utils/dailyCredits.js` resets the count daily and self-heals on every
`GET /api/users/me`.

**Credits are deducted only after a successful Gemini response.**
`reserveCredits()`/`refundCredits()` in `utils/dailyCredits.js` use an atomic
`findOneAndUpdate` (`dailyCredits: { $gte: cost }` as the filter, not a
read-then-check) so two near-simultaneous requests from the same user can't
both pass a credit check before either write lands — that race would let
someone spend more credits than they have, and did exist in an earlier,
non-atomic version of this code.

**Rate limiting** is separate from credits and caps how *fast* requests can
fire, not how many per day. Explain/Summarize/Quiz share one limiter
(`AI_RATE_LIMIT_MAX`, default 8/min). The **Assistant has its own, higher
limiter** (`AI_ASSISTANT_RATE_LIMIT_MAX`, default 20/min) — a real
back-and-forth chat session can plausibly approach the one-shot limit during
completely normal use, so it isn't shared.

**Pre-generation.** Summary and full-PDF Quiz are pre-generated once, right
after a PDF upload completes (`utils/pregenerateResourceAI.js`, queued via
`utils/aiPregenQueue.js`, concurrency capped by `AI_PREGEN_CONCURRENCY`), and
cached on the `Resource` doc. Every student who opens that resource afterward
gets the cached result instantly, free — no credit spent, no repeat Gemini
call for the same file. Only PDFs qualify (`aiPregenStatus: 'unsupported'`
for everything else, set immediately on upload rather than sitting at
`'pending'` forever).

### AI Study Assistant — how it works

A chat scoped to one PDF resource at a time, private per user (your
conversation with a document isn't visible to anyone else who opens it,
unlike the shared Summary/Quiz cache).

- **Data model**: `Conversation` (`user`, `resource`, `status: 'active'|'archived'`)
  and `Message` (`conversation`, `role: 'user'|'assistant'`, `content`) as
  separate collections — reading only the most recent N messages is a plain
  `.find().sort().limit()`, not slicing an ever-growing embedded array.
- **One active conversation per `(user, resource)`.** "New Chat" archives the
  current one and starts fresh rather than deleting history — the schema
  already supports multiple past threads per resource, even though V1's UI
  only ever surfaces the latest active one.
- **Context sent to Gemini on every message**: the PDF's extracted text
  (capped at `AI_ASSISTANT_CONTEXT_CHAR_LIMIT` chars, default 60,000) plus
  the most recent `AI_ASSISTANT_HISTORY_LIMIT` messages (default 10 — older
  messages stay stored and visible in the UI, just not re-sent to the model).
  Both caps exist because a long session against a long PDF would otherwise
  get slower, more expensive, and eventually risk exceeding the model's
  context window with every additional message.
- **Prompt-injection handling**: the PDF's extracted text is untrusted user
  content (whatever a student or contributor uploaded), not an instruction
  from us. The prompt built in `services/geminiService.js` explicitly labels
  it as reference material to answer *from*, never to take direction *from*
  — the standard mitigation for this class of risk, not a guarantee.
- **PDF-only**, same limitation as Summarize/full-PDF-Quiz and for the same
  reason (`utils/extractResourceText.js` only supports PDF text extraction in
  V1). Requesting the Assistant on a non-PDF resource returns `400`.
- **Deletion cascade**: deleting a resource also deletes every `Conversation`
  and `Message` tied to it (`resourceController.deleteResource`), same
  pattern as the existing Bookmark cleanup.

## Data model (`User`)

```
firebaseUid, email, provider ('password' | 'google'),
firstName, lastName, college, branch, semester,
profileCompleted,
role ('student' | 'trustedContributor' | 'admin'), default 'student',
canUploadCareer (Boolean, default false — independent of role),
monthlyUploadCount, uploadResetDate,
dailyCredits, lastCreditReset,
createdAt, updatedAt
```

## Data model (`Resource`)

```
category ('academic' | 'career'), default 'academic',
college (set for academic, null for career),
approvalStatus ('approved' | 'pending' | 'rejected'), default 'approved',
title, description, semester, subject, unit, topic, tags[],
resourceType ('pdf'|'doc'|'docx'|'ppt'|'pptx'|'jpg'|'png'),
fileName, fileSize, fileHash (unique index — see dedup below),
cloudinaryUrl, cloudinaryPublicId,
uploadedBy (ref User), downloads, bookmarks (cached count),
extractedText (select: false — cached PDF text for AI features),
aiPregenStatus ('pending'|'ready'|'unsupported'|'failed'),
aiSummaryCache, aiQuizCache (select: false),
aiPregenAt,
createdAt, updatedAt
```

Indexes: unique on `fileHash`; text index across `title`/`description`/`subject`/`unit`/`topic`/`tags`;
compound `{ college, semester, subject }` for academic folder-card aggregation;
compound `{ category, approvalStatus, createdAt }` for career browsing/approval-queue queries.

## Data model (`Bookmark`)

```
user (ref User), resource (ref Resource), createdAt, updatedAt
```
Unique compound index on `{ user, resource }`.

## Data model (`Conversation`)

```
user (ref User), resource (ref Resource),
status ('active' | 'archived'), default 'active',
lastMessageAt,
createdAt, updatedAt
```

## Data model (`Message`)

```
conversation (ref Conversation),
role ('user' | 'assistant'),
content,
createdAt, updatedAt
```

## Duplicate file detection

Every upload is hashed (SHA-256, over the raw bytes) before it's sent to
Cloudinary. If a `Resource` with that `fileHash` already exists, the request
returns that existing resource with `status: 'duplicate'` and nothing new is
uploaded. The unique index on `fileHash` is what actually prevents two
identical files from ever coexisting — even under a race between two
simultaneous uploads, the second `Resource.create()` fails with a Mongo
duplicate-key error, and the controller catches that, deletes the Cloudinary
asset it just (redundantly) uploaded, and returns the winning resource instead.

## Cloudinary resource_type: images vs. documents

Images (`jpg`/`png`) upload as Cloudinary `resource_type: 'image'`; PDFs and
Office documents upload as `'raw'` (see `utils/cloudinaryResourceType.js`).
This avoids Cloudinary's default PDF/ZIP delivery restriction, and matters
for deletion too (`'auto'` isn't valid for `cloudinary.uploader.destroy()`).

`sanitizeResource` returns two URLs: `cloudinaryUrl` (the raw stored asset —
not used directly for preview, since `raw`-type Cloudinary assets default to
`Content-Disposition: attachment`) and `previewUrl` (`fl_attachment:false`
inserted, used by the PDF preview and "Preview" button).

**Downloads go through `GET /api/resources/:id/download`**, not a Cloudinary
URL directly — the backend fetches the file server-side and streams it back
with an explicit `Content-Type`/`Content-Disposition`, sidestepping a
Cloudinary bug where a filename containing a literal `.` in the
`fl_attachment:<filename>` transformation returns an outright `HTTP 400`.
Because this route needs the same `Authorization: Bearer <jwt>` header as
every other API call, the frontend fetches it as a `Blob` through the normal
authenticated client rather than a plain browser navigation, then triggers
the save via a temporary `<a download>` element.

## Known limitations (carried from V1, still true in V2)

- **AI features (Summarize, full-PDF Quiz, Study Assistant) are PDF-only.**
  DOC/DOCX/PPT/PPTX/JPG/PNG aren't text-extracted in V1/V2 (would need a
  conversion step or OCR, out of scope so far). Explain and topic-based Quiz
  work for any file type, since they don't depend on extracted content.
- **"Highlight to explain" isn't wired up** — the PDF preview renders via a
  cross-origin `<iframe>` (Google's document viewer), so the browser can't
  read a text selection out of it. The Explain input accepts pasted text as
  the functional equivalent.
- **Google sign-in** was built then intentionally cut for V1/V2 launch
  simplicity — email/password only for now.
