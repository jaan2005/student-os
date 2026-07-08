import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import LoadingScreen from './LoadingScreen.jsx'

/**
 * Wraps pages that require a valid JWT session. If `requireProfile` is set,
 * authenticated users without a completed profile are sent to /profile-setup
 * instead of being allowed through.
 *
 * Works two ways:
 *   <ProtectedRoute><SomePage /></ProtectedRoute>          (wraps one element)
 *   <Route element={<ProtectedRoute requireProfile />}>    (layout route, renders <Outlet/>)
 */
export default function ProtectedRoute({ children, requireProfile = false }) {
  const { isAuthenticated, initializing, user } = useAuth()
  const location = useLocation()

  if (initializing) return <LoadingScreen />

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  if (requireProfile && user && !user.profileCompleted) {
    return <Navigate to="/profile-setup" replace />
  }

  return children ?? <Outlet />
}
