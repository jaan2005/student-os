# Student OS — Notes & Resources Module

Covers both halves: this frontend (`student-os/`) and the API in
`student-os-backend/`. See `AUTH.md` first if you haven't wired up
authentication yet — every route here requires a valid JWT session.

## Setup

1. Backend: add Cloudinary credentials to `student-os-backend/.env` (see its
   `.env.example` and README) — `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`,
   `CLOUDINARY_API_SECRET`, from your [cloudinary.com](https://cloudinary.com) dashboard.
2. `npm install` in both `student-os/` and `student-os-backend/` to pick up
   the new dependencies (`multer`, `cloudinary` on the backend).
3. Run both dev servers as usual.

## What's included

**Backend** (`student-os-backend/src/`)
```
models/Resource.js, models/Bookmark.js
middleware/upload.js         → Multer: 20MB limit, MIME-type whitelist (not extension-based)
middleware/asyncHandler.js   → wraps async route handlers so thrown errors reach errorHandler
utils/hashFile.js            → SHA-256 over raw file bytes
utils/uploadBufferToCloudinary.js
utils/resourceHelpers.js     → sanitizeResource(), getBookmarkedIdSet()
controllers/resourceController.js
controllers/bookmarkController.js
routes/resourceRoutes.js, routes/subjectRoutes.js, routes/bookmarkRoutes.js
```

**Frontend** (`student-os/src/`)
```
layouts/AppLayout.jsx        → Sidebar + <Outlet>, shares mobile-sidebar toggle via Outlet context
components/Sidebar.jsx, Topbar.jsx, SearchBar.jsx, Filters.jsx
components/ResourceCard.jsx, ResourceGrid.jsx, SubjectCard.jsx
components/UploadModal.jsx, PDFViewer.jsx, LoadingSkeleton.jsx, EmptyState.jsx
hooks/useResources.js        → list/filter/sort state + optimistic bookmark toggling
hooks/useDebounce.js
services/resourceService.js  → thin wrapper over the API routes below
lib/format.js                → file size/date formatting, file-type icon/color mapping
lib/recentlyViewed.js        → client-side "recently viewed" tracking (see below)
pages/NotesPage.jsx, SubjectPage.jsx, ResourcePage.jsx, BookmarksPage.jsx
```

## Key design decisions

**Duplicate detection is hash-first, not upload-first.** The file is hashed
(SHA-256) before it ever reaches Cloudinary. If a `Resource` with that hash
already exists, nothing is uploaded — the existing resource comes back with
`status: 'duplicate'`, and the Upload modal switches to the "this resource
already exists" view from the spec (Open Resource / Bookmark). The unique
index on `fileHash` is what actually prevents two identical files from ever
coexisting, even under a concurrent-upload race — see the comment in
`resourceController.uploadResource` for how that race is resolved (the loser
cleans up its now-redundant Cloudinary asset and returns the winner as a
duplicate too).

**"Recently Viewed" is client-side, on purpose.** The spec's data model has
exactly three collections — Users, Resources, Bookmarks. Rather than add a
fourth just to track views, `lib/recentlyViewed.js` keeps a capped list of
resource IDs in `localStorage`, recorded whenever `ResourcePage` loads. NotesPage
reads that list and batch-fetches the matching resources via
`GET /api/resources?ids=a,b,c`.

**File type is derived from the actual MIME type server-side, not trusted
from the client.** `middleware/upload.js`'s `ALLOWED_MIME_TYPES` map is the
single source of truth for what `resourceType` gets stored — a renamed `.exe`
sent as `application/pdf` would still be rejected by Multer's `fileFilter`
before it reaches the controller.

**Previewing and downloading go through completely different mechanisms —
not just different URLs.** Cloudinary's `raw` resource type (used for
PDF/DOC/PPT — see backend README for why) defaults delivery to
`Content-Disposition: attachment`, which makes the browser download the
file the instant anything requests that URL, including an `<iframe>` trying
to render it inline.

- **Preview** uses `previewUrl` (from `sanitizeResource`) — the same file
  with `fl_attachment:false` inserted server-side, used by `PDFViewer`'s
  `<iframe>`/`<img>` and the "Preview" button.
- **Download** doesn't use a Cloudinary URL at all. It hits
  `GET /api/resources/:id/download`, which fetches the file server-side and
  streams it back with `Content-Type`/`Content-Disposition` the backend
  sets explicitly. There used to be a `downloadUrl` built the same way as
  `previewUrl` (via `fl_attachment:<filename>`) — that's gone. Cloudinary's
  URL parser turned out to reject a filename containing a literal `.` with
  an outright `HTTP 400` (confirmed live), and there wasn't enough
  confidence in the exact escaping rules to keep patching around it.
  Fetching and re-serving the file ourselves sidesteps that entirely.

Because the download route needs the same `Authorization: Bearer <jwt>`
header as every other API call, `ResourceCard`/`ResourcePage` can't just
`window.open()` it — a plain browser navigation can't attach custom
headers. Instead, `resourceService.downloadResource()` fetches the file as
a `Blob` through the normal authenticated API client, and
`lib/downloadBlob.js` triggers the actual save via a temporary
`<a download>` element, which is also what lets the browser use the exact
correct filename regardless of platform.

**"Study Tools" (Generate Quiz / Ask AI / Summarize / Flashcards) are
deliberately inert in V1** — `ResourcePage`'s buttons are disabled with a
"Coming Soon" badge, per the spec. They're already scoped to a specific
resource (`resource.id`), so wiring in real AI Study Assistant / Quiz
Generator calls later is a matter of enabling the button and pointing it at
a new endpoint — no restructuring needed.

## API quick reference

See `student-os-backend/README.md` for the full route table with request/response
shapes. Summary: `GET/POST /api/resources`, `GET/PUT/DELETE /api/resources/:id`,
`GET /api/subjects`, `GET/POST/DELETE /api/bookmarks(/:id)` — all behind the
same JWT middleware as the rest of the app.
