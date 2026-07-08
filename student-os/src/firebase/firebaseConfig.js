import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

const requiredKeys = ['apiKey', 'authDomain', 'projectId', 'appId']
const missing = requiredKeys.filter((key) => !firebaseConfig[key])
if (missing.length) {
  // Surfaced loudly in dev so a missing .env doesn't fail silently with a cryptic Firebase error.
  console.error(
    `[firebase] Missing config value(s): ${missing.join(', ')}. Check your .env file against .env.example.`
  )
}

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)

// V1 is email/password only. Re-adding Google is cheap if it's wanted later:
//   import { GoogleAuthProvider } from 'firebase/auth'
//   export const googleProvider = new GoogleAuthProvider()
// then wire signInWithPopup back into AuthContext.loginWithGoogle and the
// "Continue with Google" button back into Signup/Login.

export default app
