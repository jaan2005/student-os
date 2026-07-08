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
