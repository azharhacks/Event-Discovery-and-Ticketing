import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import ToastStack from './components/ui/Toast';

import HomePage        from './pages/public/HomePage';
import EventsPage      from './pages/public/EventsPage';
import EventDetailPage from './pages/public/EventDetailPage';
import LoginPage       from './pages/auth/LoginPage';
import SignupPage      from './pages/auth/SignupPage';

import ProtectedRoute from './guards/ProtectedRoute';
import RoleRoute      from './guards/RoleRoute';

import { ROUTES } from './config/routes';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            {/* Public */}
            <Route path={ROUTES.HOME}   element={<HomePage />} />
            <Route path={ROUTES.EVENTS} element={<EventsPage />} />
            <Route path="/events/:id"   element={<EventDetailPage />} />
            <Route path={ROUTES.LOGIN}  element={<LoginPage />} />
            <Route path={ROUTES.SIGNUP} element={<SignupPage />} />

            {/* Protected — Attendee */}
            <Route element={<ProtectedRoute />}>
              <Route element={<RoleRoute roles={['ATTENDEE']} />}>
                <Route path={ROUTES.DASHBOARD} element={<div style={{padding:60,textAlign:'center'}}><h2>Attendee Dashboard</h2><p>Coming soon</p></div>} />
                <Route path={ROUTES.TICKETS}   element={<div style={{padding:60,textAlign:'center'}}><h2>My Tickets</h2><p>Coming soon</p></div>} />
              </Route>
            </Route>

            {/* Protected — Organizer */}
            <Route element={<ProtectedRoute />}>
              <Route element={<RoleRoute roles={['ORGANIZER']} />}>
                <Route path={ROUTES.ORGANIZER}        element={<div style={{padding:60,textAlign:'center'}}><h2>Organizer Dashboard</h2><p>Coming soon</p></div>} />
                <Route path={ROUTES.ORGANIZER_EVENTS} element={<div style={{padding:60,textAlign:'center'}}><h2>My Events</h2><p>Coming soon</p></div>} />
                <Route path={ROUTES.ORGANIZER_CREATE} element={<div style={{padding:60,textAlign:'center'}}><h2>Create Event</h2><p>Coming soon</p></div>} />
              </Route>
            </Route>

            {/* Protected — Admin */}
            <Route element={<ProtectedRoute />}>
              <Route element={<RoleRoute roles={['ADMIN']} />}>
                <Route path={ROUTES.ADMIN}       element={<div style={{padding:60,textAlign:'center'}}><h2>Admin Dashboard</h2><p>Coming soon</p></div>} />
                <Route path={ROUTES.ADMIN_EVENTS} element={<div style={{padding:60,textAlign:'center'}}><h2>Manage Events</h2><p>Coming soon</p></div>} />
                <Route path={ROUTES.ADMIN_USERS}  element={<div style={{padding:60,textAlign:'center'}}><h2>Manage Users</h2><p>Coming soon</p></div>} />
              </Route>
            </Route>

            <Route path="*" element={<Navigate to={ROUTES.HOME} replace />} />
          </Routes>
          <ToastStack />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
