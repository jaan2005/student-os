import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { ROLES } from '../constants/roles.js'
import LoadingScreen from './LoadingScreen.jsx'

/**
 * Frontend-side gate for admin-only pages. This is a UX nicety, not the
 * security boundary — the actual enforcement lives server-side in
 * authorizeRoles on the /api/admin/* routes. This just keeps non-admins
 * from seeing the page shell at all.
 */
export default function AdminRoute({ children }) {
  const { user, initializing } = useAuth()

  if (initializing) return <LoadingScreen />

  if (user?.role !== ROLES.ADMIN) {
    return <Navigate to="/dashboard" replace />
  }

  return children ?? <Outlet />
}
