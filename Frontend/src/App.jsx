import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import ToastStack from "./components/ui/Toast";

// Public pages
import HomePage        from "./pages/public/HomePage";
import EventsPage      from "./pages/public/EventsPage";
import EventDetailPage from "./pages/public/EventDetailPage";
import LoginPage       from "./pages/auth/LoginPage";
import SignupPage      from "./pages/auth/SignupPage";

// Attendee / shared protected pages
import AttendeeDashboard from "./pages/attendee/AttendeeDashboard";
import CheckoutPage      from "./pages/attendee/CheckoutPage";
import MyTicketsPage     from "./pages/attendee/MyTicketsPage";
import ProfilePage       from "./pages/attendee/ProfilePage";

// Organizer pages
import OrganizerDashboard  from "./pages/organizer/OrganizerDashboard";
import CreateEventPage      from "./pages/organizer/CreateEventPage";
import EditEventPage        from "./pages/organizer/EditEventPage";
import EventAttendeesPage  from "./pages/organizer/EventAttendeesPage";

// Admin pages
import AdminDashboard from "./pages/admin/AdminDashboard";

import ProtectedRoute from "./guards/ProtectedRoute";
import RoleRoute      from "./guards/RoleRoute";
import { ROUTES } from "./config/routes";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            {/* ── Public ─────────────────────────────── */}
            <Route path={ROUTES.HOME}   element={<HomePage />} />
            <Route path={ROUTES.EVENTS} element={<EventsPage />} />
            <Route path="/events/:id"   element={<EventDetailPage />} />
            <Route path={ROUTES.LOGIN}  element={<LoginPage />} />
            <Route path={ROUTES.SIGNUP} element={<SignupPage />} />

            {/* ── Any logged-in user ─────────────────── */}
            <Route element={<ProtectedRoute />}>
              <Route path={ROUTES.PROFILE}  element={<ProfilePage />} />
              <Route path={ROUTES.CHECKOUT} element={<CheckoutPage />} />
            </Route>

            {/* ── Attendee only ──────────────────────── */}
            <Route element={<ProtectedRoute />}>
              <Route element={<RoleRoute roles={["ATTENDEE"]} />}>
                <Route path={ROUTES.DASHBOARD} element={<AttendeeDashboard />} />
                <Route path={ROUTES.TICKETS}   element={<MyTicketsPage />} />
              </Route>
            </Route>

            {/* ── Organizer only ─────────────────────── */}
            <Route element={<ProtectedRoute />}>
              <Route element={<RoleRoute roles={["ORGANIZER"]} />}>
                <Route path={ROUTES.ORGANIZER}        element={<OrganizerDashboard />} />
                <Route path={ROUTES.ORGANIZER_EVENTS} element={<OrganizerDashboard />} />
                <Route path={ROUTES.ORGANIZER_CREATE} element={<CreateEventPage />} />
                <Route path="/organizer/events/:id/edit"       element={<EditEventPage />} />
                <Route path="/organizer/events/:id/attendees"  element={<EventAttendeesPage />} />
              </Route>
            </Route>

            {/* ── Admin only ─────────────────────────── */}
            <Route element={<ProtectedRoute />}>
              <Route element={<RoleRoute roles={["ADMIN"]} />}>
                <Route path={ROUTES.ADMIN}        element={<AdminDashboard />} />
                <Route path={ROUTES.ADMIN_EVENTS} element={<AdminDashboard />} />
                <Route path={ROUTES.ADMIN_USERS}  element={<AdminDashboard />} />
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
