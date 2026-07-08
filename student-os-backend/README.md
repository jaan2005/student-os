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
createdAt, updatedAt
```

## Data model (`Resource`)

```
title, description, semester, subject, unit, topic, tags[],
resourceType ('pdf'|'doc'|'docx'|'ppt'|'pptx'|'jpg'|'png'),
fileName, fileSize, fileHash (unique index — see dedup below),
cloudinaryUrl, cloudinaryPublicId,
uploadedBy (ref User), downloads, bookmarks (cached count),
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
   therefore returns two URLs: `cloudinaryUrl` (unmodified, used for the
   Download button) and `previewUrl` (same file, with `fl_attachment:false`
   inserted via `utils/cloudinaryUrls.js`, used only by the frontend's
   `PDFViewer`). Using the wrong one for the wrong purpose is exactly what
   causes "clicking Open just downloads the file instead of previewing it."
