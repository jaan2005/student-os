import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import GuestRoute from './components/GuestRoute.jsx'
import AdminRoute from './components/AdminRoute.jsx'
import AppLayout from './layouts/AppLayout.jsx'
import LandingPage from './pages/LandingPage.jsx'
import Login from './pages/Login.jsx'
import Signup from './pages/Signup.jsx'
import ProfileSetup from './pages/ProfileSetup.jsx'
import Dashboard from './pages/Dashboard.jsx'
import NotesPage from './pages/NotesPage.jsx'
import CareerResourcesPage from './pages/CareerResourcesPage.jsx'
import SubjectPage from './pages/SubjectPage.jsx'
import ResourcePage from './pages/ResourcePage.jsx'
import BookmarksPage from './pages/BookmarksPage.jsx'
import AdminUsersPage from './pages/AdminUsersPage.jsx'
import AdminCareerApprovalsPage from './pages/AdminCareerApprovalsPage.jsx'

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<LandingPage />} />

        <Route
          path="/login"
          element={
            <GuestRoute>
              <Login />
            </GuestRoute>
          }
        />
        <Route
          path="/signup"
          element={
            <GuestRoute>
              <Signup />
            </GuestRoute>
          }
        />

        <Route
          path="/profile-setup"
          element={
            <ProtectedRoute>
              <ProfileSetup />
            </ProtectedRoute>
          }
        />

        {/* Everything below shares the Sidebar + Outlet layout and requires
            both a valid session AND a completed profile. */}
        <Route element={<ProtectedRoute requireProfile />}>
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/notes" element={<NotesPage />} />
            <Route path="/notes/:semester/:subject" element={<SubjectPage />} />
            <Route path="/career-resources" element={<CareerResourcesPage />} />
            <Route path="/resources/:id" element={<ResourcePage />} />
            <Route path="/bookmarks" element={<BookmarksPage />} />

            <Route element={<AdminRoute />}>
              <Route path="/admin/users" element={<AdminUsersPage />} />
              <Route path="/admin/career-resources" element={<AdminCareerApprovalsPage />} />
            </Route>
          </Route>
        </Route>
      </Routes>
    </AuthProvider>
  )
}
