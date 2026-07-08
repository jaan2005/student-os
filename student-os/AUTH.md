# Student OS — Authentication Module

Covers both halves of the auth system: this frontend (`student-os/`) and the
API in `student-os-backend/`. Read this alongside each folder's own README.

## Stack

- **Frontend:** React + Vite, Tailwind CSS, React Router, Framer Motion, Firebase client SDK, Axios
- **Backend:** Express, MongoDB Atlas (Mongoose), Firebase Admin SDK, JWT

## Firebase project setup (one-time)

1. Create a project at [console.firebase.google.com](https://console.firebase.google.com).
2. **Authentication → Sign-in method** → enable **Email/Password**. (Google
   sign-in was cut for V1 — see note below — so this is the only provider
   that needs enabling.)
3. **Project settings → General → Your apps** → add a Web app → copy the config
   values into `student-os/.env` (see `.env.example`).
4. **Project settings → Service accounts** → Generate new private key → use that
   JSON to fill `student-os-backend/.env` (see its `.env.example`).

## Two-token model

1. **Firebase ID token** — issued by Firebase after `createUserWithEmailAndPassword`
   or `signInWithEmailAndPassword`. Sent once to the backend's `POST /api/auth/sync`.
2. **Backend JWT** — issued by Express after it verifies that ID token with the
   Firebase Admin SDK. Stored in `localStorage` on the client and sent as
   `Authorization: Bearer <jwt>` on every other request. This is what actually
   protects `/api/users/me` and `/api/users/profile`, and what `ProtectedRoute`
   checks on the frontend.

Keeping these separate means the rest of the API (and everything built on top
of it later) never has to call Firebase Admin again after the initial sync —
it just verifies our own JWT.

> **Note on Google sign-in:** it was implemented and working, but removed for
> V1 to keep the auth surface simple — email/password alone is enough to
> ship on, and it removes an extra failure mode (Google account/consent-screen
> configuration issues) from testing and support. The backend's `authController`
> is provider-agnostic (it reads `firebase.sign_in_provider` off the verified
> token either way), so re-adding it later is purely a frontend change: restore
> `googleProvider` in `firebase/firebaseConfig.js`, add `loginWithGoogle` back to
> `AuthContext`, and bring back a "Continue with Google" button on Signup/Login.

## End-to-end flow

**Email signup**
```
Signup form → createUserWithEmailAndPassword (Firebase)
            → POST /api/auth/sync { idToken }
            → backend verifies token, creates MongoDB user (new)
            → backend returns { token, isNewUser: true, user }
            → frontend stores JWT, redirects to /profile-setup
```

**Email login**
```
Login form → signInWithEmailAndPassword (Firebase)
           → POST /api/auth/sync { idToken }
           → backend finds existing MongoDB user
           → backend returns { token, isNewUser: false, user }
           → frontend redirects to /dashboard if user.profileCompleted,
             otherwise /profile-setup (covers an account that signed up but
             never finished setup)
```

**Profile setup**
```
/profile-setup (requires a valid JWT — GuestRoute/ProtectedRoute handle this)
  → PUT /api/users/profile { firstName, lastName, college, branch, semester }
  → backend sets profileCompleted: true
  → frontend redirects to /dashboard
```

**Dashboard**
```
/dashboard (ProtectedRoute, requireProfile)
  → no valid JWT → redirect to /login
  → valid JWT but profileCompleted: false → redirect to /profile-setup
  → otherwise renders
```

## Frontend structure

```
src/
  firebase/firebaseConfig.js   → initializes Firebase app, exports auth
  lib/api.js                    → Axios instance, attaches JWT from localStorage
  lib/authErrors.js             → maps Firebase/API error codes to friendly copy
  context/AuthContext.jsx       → signup/login/logout/saveProfile,
                                   session restore on reload, exposes `user`, `isAuthenticated`
  components/
    ProtectedRoute.jsx          → requires a valid session; optional `requireProfile`
    GuestRoute.jsx               → keeps signed-in users off /login and /signup
    LoadingScreen.jsx
    auth/
      AuthShell.jsx              → shared two-column layout for Signup/Login
      FormField.jsx               → labeled text input with icon + error state
      PasswordField.jsx           → FormField variant with show/hide toggle
      ErrorBanner.jsx
      SubmitButton.jsx
  pages/
    Signup.jsx
    Login.jsx
    ProfileSetup.jsx
    Dashboard.jsx
```

## Backend structure

See `student-os-backend/README.md` for the full route table. Summary:

```
POST /api/auth/sync      verifies Firebase ID token, finds/creates the user, issues a JWT
GET  /api/users/me       returns the current user (also used to validate a stored JWT)
PUT  /api/users/profile  saves Profile Setup fields, sets profileCompleted: true
```

## Testing the flow locally

1. `cd student-os-backend && npm install && cp .env.example .env` → fill in Mongo + Firebase Admin values → `npm run dev`
2. `cd student-os && npm install && cp .env.example .env` → fill in Firebase web config → `npm run dev`
3. Visit `/signup`, create an account → you should land on `/profile-setup`.
4. Fill the form → you should land on `/dashboard`.
5. Reload the page — you should stay on `/dashboard` (JWT session restore).
6. Sign out → visiting `/dashboard` directly should redirect to `/login`.
