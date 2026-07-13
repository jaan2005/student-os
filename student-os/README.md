# Student OS — Frontend

React + Vite, Tailwind CSS, React Router, Lucide icons, and Framer Motion.

Contains the marketing landing page **and** the full authentication module
(Signup, Login, Profile Setup, Dashboard). Auth is powered by Firebase on the
client and talks to the Express API in `student-os-backend/` for everything
past sign-in — see `AUTH.md` for the complete flow.

## Getting started

```bash
npm install
cp .env.example .env   # fill in your Firebase web app config + API URL
npm run dev
```

Then open the printed local URL (usually `http://localhost:5173`).

This app talks to the **Student OS backend** (`student-os-backend/`) for
everything past Firebase sign-in — user records, JWT sessions, and profile
data. Start that alongside this app (see its own README) before testing
signup/login end to end.

To build for production:

```bash
npm run build
npm run preview
```

## Authentication module

Email/password authentication, backed by Firebase Authentication on the
client and Express + MongoDB Atlas + Firebase Admin SDK on the server. See
`AUTH.md` for the full flow, folder layout, and Firebase project setup steps.

## Project structure

```
src/
  components/
    Navbar.jsx, Hero.jsx, Features.jsx, Roadmap.jsx,
    WhyChoose.jsx, CTA.jsx, Footer.jsx   → landing page sections
    ProtectedRoute.jsx    → guards routes that require a valid JWT session
    GuestRoute.jsx         → keeps signed-in users off /login and /signup
    LoadingScreen.jsx
    auth/
      AuthShell.jsx         → shared two-column layout for Signup/Login
      FormField.jsx          → labeled text input, icon + error state
      PasswordField.jsx      → FormField variant with show/hide toggle
      ErrorBanner.jsx, SubmitButton.jsx
  context/
    AuthContext.jsx        → Firebase auth + backend sync + JWT session state
  firebase/
    firebaseConfig.js      → Firebase client SDK init
  lib/
    api.js                 → Axios instance, attaches JWT to every request
    authErrors.js          → Firebase/API error codes → friendly messages
  pages/
    LandingPage.jsx
    Signup.jsx, Login.jsx, ProfileSetup.jsx, Dashboard.jsx
  App.jsx                  → route definitions, wraps app in AuthProvider
  main.jsx                 → app entry, wraps App in BrowserRouter
  index.css                → Tailwind directives + reusable utility classes
```

## Design tokens (see `tailwind.config.js`)

- **Background:** `#050816` (`base`), with raised surfaces `base-raised` / `base-card`
- **Primary:** `#2563EB`, with `primary-light` (`#60A5FA`) and `primary-dark` (`#1D4ED8`)
- **Accents:** `accent-violet` (`#7C5CFC`), `accent-cyan` (`#22D3EE`) — used sparingly in gradients and status indicators
- **Type:** Space Grotesk (display/headings), Inter (body), JetBrains Mono (eyebrows, labels, roadmap numbers — a nod to the "OS" theme)

## Notes

- Routing: "Sign In" → `/login`, "Get Started" / "Create Free Account" → `/signup`. After auth, new users land on `/profile-setup`; returning users with a completed profile land on `/dashboard`.
- Nav links (`Features`, `Roadmap`, `About`) scroll to in-page sections via anchors.
- Respects `prefers-reduced-motion`; all interactive elements have visible focus states.
- No external image assets are used anywhere — mockups and illustrations are built entirely from CSS/markup to avoid any copyright concerns.

## Logo

`src/components/Logo.jsx` — a custom SVG mark (a simplified browser/app-window
frame, a literal nod to the "OS" in the name), built to the same visual spec
as the Lucide icons it replaced (24x24 viewBox, `strokeWidth: 2`, round caps)
so it drops into the same `size`/`className` prop API everywhere the old
`Layers` icon was used: `Navbar`, `Sidebar`, `AuthShell`, `Footer`.

`public/logo-mark.svg` is a separate, self-contained version (dark navy
background baked in) used for the favicon and PWA icons — the in-app
`Logo.jsx` is just the glyph and relies on whatever colored container it's
placed in, which doesn't work for a favicon/home-screen icon that needs to
render on an arbitrary background.

## Install as an app (PWA)

`public/manifest.webmanifest` + `public/sw.js` (registered in `main.jsx`)
make the app installable on Android/Chrome (a real "Install" prompt) and
addable-to-home-screen on iOS Safari (manual, via Share menu — Apple doesn't
allow a programmatic prompt there). `src/hooks/useInstallPrompt.js` handles
both cases; `InstallAppButton.jsx` (Navbar) and `InstallAppBanner.jsx`
(Dashboard, dismissible) are the two surfaced entry points.

The service worker (`public/sw.js`) is **deliberately a no-caching
pass-through** — just enough to satisfy Chrome's installability requirement
(a fetch handler must exist), without caching anything. That's intentional:
a caching service worker during an actively-updating launch week can easily
serve students a stale, already-fixed version of the app after a deploy.
Real offline support is a reasonable thing to add later, once the release
cadence has slowed down.

**One manual step needed for full compatibility — this repo doesn't include
it because there's no image-rasterization tool in the environment this was
built in:** the manifest and `index.html` reference three PNG files that
don't exist yet:
```
public/icons/icon-192.png          (192x192)
public/icons/icon-512.png          (512x512)
public/icons/icon-maskable-512.png (512x512, with safe-zone padding for Android's adaptive icon shapes)
public/icons/apple-touch-icon.png  (180x180, for iOS home screen)
```
Until these exist, install still works today on Android/Chrome (it falls
back to `public/logo-mark.svg`, which Chrome supports directly in the
manifest), but iOS's home-screen icon and Android's "maskable" adaptive-icon
variant won't look right without real PNGs. Fastest fix: upload
`public/logo-mark.svg` to a free tool like
[realfavicongenerator.net](https://realfavicongenerator.net) or
[maskable.app](https://maskable.app), download the generated PNGs, and drop
them into `public/icons/` with the exact filenames above — no code changes
needed once they're in place.
