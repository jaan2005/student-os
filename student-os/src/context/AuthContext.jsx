import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react'
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth'
import { auth } from '../firebase/firebaseConfig.js'
import api, { TOKEN_KEY } from '../lib/api.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [firebaseUser, setFirebaseUser] = useState(null)
  const [user, setUser] = useState(null) // MongoDB profile document
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY))
  const [initializing, setInitializing] = useState(true)

  // While true, the onAuthStateChanged listener defers to the in-flight
  // manual signup/login call instead of syncing itself, avoiding a
  // duplicate /auth/sync request race on brand-new accounts.
  const manualAuthInFlight = useRef(false)

  const persistToken = (nextToken) => {
    if (nextToken) {
      localStorage.setItem(TOKEN_KEY, nextToken)
    } else {
      localStorage.removeItem(TOKEN_KEY)
    }
    setToken(nextToken)
  }

  const syncWithBackend = useCallback(async (fbUser) => {
    const idToken = await fbUser.getIdToken()
    const { data } = await api.post('/auth/sync', { idToken })
    persistToken(data.token)
    setUser(data.user)
    return data
  }, [])

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser)

      if (manualAuthInFlight.current) return

      if (!fbUser) {
        persistToken(null)
        setUser(null)
        setInitializing(false)
        return
      }

      // Session restore path (page refresh / return visit).
      try {
        const existingToken = localStorage.getItem(TOKEN_KEY)
        if (existingToken) {
          const { data } = await api.get('/users/me')
          setUser(data.user)
        } else {
          await syncWithBackend(fbUser)
        }
      } catch (err) {
        persistToken(null)
        setUser(null)
      } finally {
        setInitializing(false)
      }
    })

    return unsubscribe
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const runManualAuth = async (action) => {
    manualAuthInFlight.current = true
    setInitializing(true)
    try {
      return await action()
    } finally {
      manualAuthInFlight.current = false
      setInitializing(false)
    }
  }

  const signup = (email, password) =>
    runManualAuth(async () => {
      const cred = await createUserWithEmailAndPassword(auth, email, password)
      setFirebaseUser(cred.user)
      return syncWithBackend(cred.user)
    })

  const login = (email, password) =>
    runManualAuth(async () => {
      const cred = await signInWithEmailAndPassword(auth, email, password)
      setFirebaseUser(cred.user)
      return syncWithBackend(cred.user)
    })

  const logout = async () => {
    await signOut(auth)
    persistToken(null)
    setUser(null)
  }

  const refreshUser = useCallback(async () => {
    const { data } = await api.get('/users/me')
    setUser(data.user)
    return data.user
  }, [])

  const saveProfile = useCallback(async (profile) => {
    const { data } = await api.put('/users/profile', profile)
    setUser(data.user)
    return data.user
  }, [])

  // Called by AI panels after a successful Explain/Summarize/Quiz call so
  // the displayed credit count updates instantly, without a full re-fetch.
  const updateCredits = useCallback((remaining) => {
    setUser((u) => (u ? { ...u, dailyCredits: remaining } : u))
  }, [])

  const value = {
    firebaseUser,
    user,
    token,
    initializing,
    isAuthenticated: Boolean(token && user),
    signup,
    login,
    logout,
    refreshUser,
    saveProfile,
    updateCredits,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
