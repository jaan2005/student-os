const FIREBASE_MESSAGES = {
  'auth/email-already-in-use': 'An account with this email already exists. Try signing in instead.',
  'auth/invalid-email': 'That email address doesn\u2019t look right.',
  'auth/weak-password': 'Password should be at least 6 characters.',
  'auth/user-not-found': 'No account found with that email.',
  'auth/wrong-password': 'Incorrect email or password.',
  'auth/invalid-credential': 'Incorrect email or password.',
  'auth/too-many-requests': 'Too many attempts. Please wait a moment and try again.',
  'auth/popup-closed-by-user': 'Google sign-in was closed before completing.',
  'auth/cancelled-popup-request': 'Google sign-in was cancelled.',
  'auth/network-request-failed': 'Network error. Check your connection and try again.',
}

/**
 * Normalizes Firebase Auth errors and backend API errors into a single
 * human-readable string for display in a form.
 */
export function getAuthErrorMessage(err) {
  if (err?.code && FIREBASE_MESSAGES[err.code]) {
    return FIREBASE_MESSAGES[err.code]
  }
  const apiMessage = err?.response?.data?.message
  if (apiMessage) return apiMessage
  if (err?.message) return err.message
  return 'Something went wrong. Please try again.'
}
