import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { ROUTES } from '../../config/routes';

export default function Navbar() {
  const { isLoggedIn, user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchVal, setSearchVal]       = useState('');
  const navigate = useNavigate();

  const initials = (user?.fullName || 'U')
    .split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  const firstName    = user?.fullName?.split(' ')[0] || 'User';
  const isOrganizer  = user?.role === 'ORGANIZER';
  const isAdmin      = user?.role === 'ADMIN';

  const handleSearch = (e) => {
    if (e.key === 'Enter' && searchVal.trim()) {
      navigate(`${ROUTES.EVENTS}?q=${encodeURIComponent(searchVal.trim())}`);
    }
  };

  return (
    <nav className="navbar">
      <div className="container nav-inner">
        <Link to={ROUTES.HOME} className="nav-logo">
          <img src="/images/hafla-logo.png" alt="Hafla" className="nav-logo-img" />
        </Link>

        <div className="nav-links">
          <Link to={ROUTES.HOME}   className="nav-link">Events</Link>
          <Link to={ROUTES.HELP}   className="nav-link">Help</Link>
        </div>

        <div className="nav-search">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            type="text"
            placeholder="Search events..."
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            onKeyDown={handleSearch}
          />
        </div>

        <div className="nav-actions" id="nav-auth">
          {isLoggedIn ? (
            <div className="nav-user">
              <button
                className="nav-avatar-btn"
                onClick={() => setDropdownOpen((o) => !o)}
                aria-label="User menu"
              >
                <div className="nav-avatar">{initials}</div>
                <span className="nav-username">{firstName}</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </button>

              {dropdownOpen && (
                <div className="nav-dropdown open">
                  <div className="nav-dropdown-header">
                    <div className="nav-avatar nav-avatar-lg">{initials}</div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>{user?.fullName}</div>
                      <div style={{ fontSize: 12, color: 'var(--muted)' }}>{user?.email}</div>
                      <span className="nav-role-badge">
                        {user?.role === 'ADMIN' ? 'Admin' : isOrganizer ? 'Organizer' : 'Attendee'}
                      </span>
                    </div>
                  </div>
                  <div className="nav-dropdown-divider" />
                  {user?.role === 'ATTENDEE' && (
                    <Link to={ROUTES.DASHBOARD} className="nav-dropdown-item" onClick={() => setDropdownOpen(false)}>
                      My Dashboard
                    </Link>
                  )}
                  <Link to={ROUTES.TICKETS} className="nav-dropdown-item" onClick={() => setDropdownOpen(false)}>
                    My Tickets
                  </Link>
                  {isOrganizer && (
                    <>
                      <Link to={ROUTES.ORGANIZER} className="nav-dropdown-item" onClick={() => setDropdownOpen(false)}>
                        Organizer Dashboard
                      </Link>
                      <Link to={ROUTES.ORGANIZER_CREATE} className="nav-dropdown-item" onClick={() => setDropdownOpen(false)}>
                        Create Event
                      </Link>
                    </>
                  )}
                  {isAdmin && (
                    <Link to={ROUTES.ADMIN} className="nav-dropdown-item" onClick={() => setDropdownOpen(false)}>
                      Admin Dashboard
                    </Link>
                  )}
                  <Link to={ROUTES.PROFILE} className="nav-dropdown-item" onClick={() => setDropdownOpen(false)}>
                    Profile Settings
                  </Link>
                  <div className="nav-dropdown-divider" />
                  <button
                    className="nav-dropdown-item nav-dropdown-logout"
                    onClick={() => { logout(); setDropdownOpen(false); }}
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link to={ROUTES.LOGIN} className="btn btn-dark btn-sm">Login / Sign Up</Link>
          )}
        </div>
      </div>
    </nav>
  );
}
