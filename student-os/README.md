# Student OS — Frontend

React + Vite, Tailwind CSS, React Router, Lucide icons, and Framer Motion.

Marketing landing page, the full authentication module, Notes & Resources,
Career Resources, Bookmarks, the AI Learning Module (Explain / Summarize /
Quiz / Study Assistant), and Admin tooling. Auth is powered by Firebase on
the client and everything else talks to the Express API in
`student-os-backend/` — see `AUTH.md` for the complete auth flow.

## Getting started

```bash
npm install
cp .env.example .env   # fill in your Firebase web app config + API URL
npm run dev
```

Then open the printed local URL (usually `http://localhost:5173`).

This app talks to the **Student OS backend** (`student-os-backend/`) for
everything past Firebase sign-in. Start that alongside this app (see its own
README) before testing anything end to end — including running its one-time
`npm run backfill-college` migration if you're pointing at a database that
has resources predating V2 (see the backend README's "Migrating to V2").

To build for production:

```bash
npm run build
npm run preview
```

## What's new in V2

- **Career Resources** (`/career-resources`) — a second browse/upload
  surface alongside Notes & Resources, visible across colleges, gated by a
  separate `canUploadCareer` permission (not the academic
  `trustedContributor` role). Submissions show a "Pending Review" or
  "Rejected" badge to their own uploader until an admin decides.
- **Admin: Career Approvals** (`/admin/career-resources`) — preview, approve,
  or reject pending Career Resources. The sidebar shows a live pending count
  badge for admins.
- **Admin: Career Access toggle** — a new column on `/admin/users` to grant
  or revoke `canUploadCareer` per user, independent of their academic role.
- **AI Study Assistant** — a real chat panel (`components/ai/AssistantPanel.jsx`),
  opened from a PDF resource's Study Tools. Persistent conversation history,
  a "New Chat" reset, and the same daily-credit badge as Explain/Summarize/Quiz.
- **Multi-college groundwork** — `constants/colleges.js` now supports a real
  list; Notes & Resources, uploads, and search are all scoped to the signed-in
  user's own college automatically (enforced server-side, not just hidden in
  the UI).

## Authentication module

Email/password authentication, backed by Firebase Authentication on the
client and Express + MongoDB Atlas + Firebase Admin SDK on the server. See
`AUTH.md` for the full flow, folder layout, and Firebase project setup steps.

## Project structure

```
src/
  components/
    Navbar.jsx, Hero.jsx, Features.jsx, Roadmap.jsx,
    WhyChoose.jsx, CTA.jsx, Footer.jsx     → landing page sections
    ProtectedRoute.jsx, AdminRoute.jsx      → route guards (valid JWT / admin role)
    GuestRoute.jsx                          → keeps signed-in users off /login and /signup
    Sidebar.jsx, Topbar.jsx                 → app shell nav (college-scoped Notes,
                                               Career Resources, admin items when applicable)
    UploadModal.jsx                         → shared upload form, branches by
                                               `category` ('academic' | 'career')
    ResourceCard.jsx, ResourceGrid.jsx,
    Filters.jsx, PDFViewer.jsx
    LoadingScreen.jsx, LoadingSkeleton.jsx, EmptyState.jsx
    auth/
      AuthShell.jsx, FormField.jsx, PasswordField.jsx,
      ErrorBanner.jsx, SubmitButton.jsx
    ai/
      AIPanelShell.jsx        → shared modal shell for all four AI panels
      AICreditsBadge.jsx      → daily-credit pill, shared across panels
      AIContentBlocks.jsx     → shared structured-output rendering (headings, bullet lists, pills)
      ExplainPanel.jsx, SummarizePanel.jsx, QuizPanel.jsx
      AssistantPanel.jsx      → the chat — message list, composer, "New Chat", credits
  context/
    AuthContext.jsx           → Firebase auth + backend sync + JWT session + credits state
  constants/
    roles.js                  → ROLES, canUpload(), canUploadCareer()
    colleges.js                → ALLOWED_COLLEGES (must match backend's constants.js)
    resourceOptions.js, ai.js
  firebase/
    firebaseConfig.js
  hooks/
    useResources.js            → generic list-fetching hook (search/filter/sort/category)
    useDebounce.js, useInstallPrompt.js
  lib/
    api.js                     → Axios instance, attaches JWT to every request
    authErrors.js
    recentlyViewed.js          → localStorage, namespaced per category ('academic' | 'career')
    previewUrl.js, downloadBlob.js, format.js
  pages/
    LandingPage.jsx
    Signup.jsx, Login.jsx, ProfileSetup.jsx, Dashboard.jsx
    NotesPage.jsx, SubjectPage.jsx, ResourcePage.jsx, BookmarksPage.jsx
    CareerResourcesPage.jsx    → cross-college browse, no subject/semester grouping
    AdminUsersPage.jsx          → roles + Career Access toggle
    AdminCareerApprovalsPage.jsx → the approval queue
  services/
    resourceService.js, adminService.js, aiService.js
  App.jsx                      → route definitions, wraps app in AuthProvider
  main.jsx                     → app entry, wraps App in BrowserRouter
  index.css                    → Tailwind directives + reusable utility classes
```

## Design tokens (see `tailwind.config.js`)

- **Background:** `#050816` (`base`), with raised surfaces `base-raised` / `base-card`
- **Primary:** `#2563EB`, with `primary-light` (`#60A5FA`) and `primary-dark` (`#1D4ED8`)
- **Accents:** `accent-violet` (`#7C5CFC`), `accent-cyan` (`#22D3EE`) — used sparingly in gradients and status indicators
- **Type:** Space Grotesk (display/headings), Inter (body), JetBrains Mono (eyebrows, labels — a nod to the "OS" theme)

## Notes & Resources vs. Career Resources

Both share `UploadModal`, `ResourceCard`, `ResourceGrid`, and `Filters` —
the differences are entirely in what props/`category` get passed in:

| | Notes & Resources | Career Resources |
|---|---|---|
| Scope | Own college only | Every college |
| Organized by | Semester → Subject (`SubjectPage.jsx`) | Not organized — search/browse only |
| Upload gate | `trustedContributor` / `admin` role | `canUploadCareer` flag / `admin` |
| Goes live | Immediately | After admin approval |
| Upload fields | Title, semester, subject required | Title, description required |

`Filters` already supported `showSemester`/`showSubject` toggles before V2 —
Career Resources just passes `showSemester={false} showSubject={false}`
rather than needing a separate filter component.

## AI Learning Module (frontend)

Four panels, all rendered from a PDF resource's (or any resource's, for
Explain) Study Tools section on `ResourcePage.jsx`, sharing `AIPanelShell`
and `AICreditsBadge`:

- **Explain** — type a topic or paste text, works on any file type.
- **Summarize** / **Quiz** — PDF only; instant if pre-generated server-side,
  otherwise a live call.
- **Study Assistant** — PDF only, shows a "PDF ONLY" badge on other file
  types instead of opening. On open, fetches (or lazily creates) the user's
  active conversation for that resource via `GET /api/ai/assistant/:resourceId`.
  Sends messages optimistically (shows the student's message immediately,
  rolls back if the request fails), updates the shared credit count from
  `AuthContext.updateCredits()` after every successful message, and offers
  "New Chat" to archive the current thread and start over.

All four read/write `user.dailyCredits` through the same `AuthContext`
state, so the credit badge stays in sync no matter which panel was last used.

## Deploying (Vercel)

`vercel.json` rewrites every path to `index.html`, which is required for a
client-side-routed app like this one. Without it, anything other than the
exact root URL — refreshing `/career-resources`, opening a bookmarked deep
link, or launching the installed PWA — 404s, since those are real HTTP
requests straight to Vercel for a literal file at that path that doesn't
exist; only in-app navigation is handled by React Router in the browser.

## Notes

- Routing: "Sign In" → `/login`, "Get Started" / "Create Free Account" → `/signup`. After auth, new users land on `/profile-setup`; returning users with a completed profile land on `/dashboard`.
- Nav links (`Features`, `Roadmap`, `About`) scroll to in-page sections via anchors.
- Respects `prefers-reduced-motion`; all interactive elements have visible focus states.
- No external image assets are used anywhere — mockups and illustrations are built entirely from CSS/markup to avoid any copyright concerns.
- `lib/recentlyViewed.js` is namespaced by category (`{ academic: [...], career: [...] }` in one localStorage key) so Notes & Resources and Career Resources track separate "recently viewed" lists without colliding.

## Logo

`src/components/Logo.jsx` — a custom SVG mark (a simplified browser/app-window
frame, a literal nod to the "OS" in the name), built to the same visual spec
as the Lucide icons it replaced (24x24 viewBox, `strokeWidth: 2`, round caps)
so it drops into the same `size`/`className` prop API everywhere the old
`Layers` icon was used.

`public/logo-mark.svg` is a separate, self-contained version (dark navy
background baked in) used for the favicon and PWA icons.

## Install as an app (PWA)

`public/manifest.webmanifest` + `public/sw.js` (registered in `main.jsx`)
make the app installable on Android/Chrome and addable-to-home-screen on iOS
Safari (manual, via Share menu). `src/hooks/useInstallPrompt.js` handles both
cases; `InstallAppButton.jsx` (Navbar) and `InstallAppBanner.jsx` (Dashboard,
dismissible) are the two surfaced entry points.

The service worker (`public/sw.js`) is **deliberately a no-caching
pass-through** — just enough to satisfy Chrome's installability requirement,
without risking a stale cached build during active development.

**One manual step still needed for full compatibility** — this repo doesn't
include an image-rasterization tool, so the manifest and `index.html`
reference PNG files that don't exist yet:
```
public/icons/icon-192.png          (192x192)
public/icons/icon-512.png          (512x512)
public/icons/icon-maskable-512.png (512x512, with safe-zone padding for Android's adaptive icon shapes)
public/icons/apple-touch-icon.png  (180x180, for iOS home screen)
```
Install still works today on Android/Chrome (falls back to
`public/logo-mark.svg`), but iOS's home-screen icon and Android's "maskable"
variant won't look right without real PNGs. Fastest fix: upload
`public/logo-mark.svg` to [realfavicongenerator.net](https://realfavicongenerator.net)
or [maskable.app](https://maskable.app), download the generated PNGs, and
drop them into `public/icons/` with the exact filenames above.

## Known limitations (carried from V1, still true in V2)

- **Settings** and **Flashcards** are still not built — shown as disabled/
  "Coming Soon" in the sidebar and Study Tools respectively.
- **Google sign-in** was built then intentionally cut for launch simplicity
  — email/password only for now.
- **"Highlight to explain"** isn't wired up (the PDF preview renders via a
  cross-origin iframe); the Explain panel accepts pasted text as the
  functional equivalent.
