import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import LoadingScreen from './LoadingScreen.jsx'

/**
 * Wraps /login and /signup so a signed-in user landing there is routed
 * straight to wherever they belong instead of seeing the form again.
 */
export default function GuestRoute({ children }) {
  const { isAuthenticated, initializing, user } = useAuth()

  if (initializing) return <LoadingScreen />

  if (isAuthenticated) {
    return <Navigate to={user?.profileCompleted ? '/dashboard' : '/profile-setup'} replace />
  }

  return children
}
