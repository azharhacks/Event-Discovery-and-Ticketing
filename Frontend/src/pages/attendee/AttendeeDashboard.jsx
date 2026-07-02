import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import { getMyTickets } from '../../lib/api';
import { useAuth } from '../../hooks/useAuth';
import { ROUTES } from '../../config/routes';

const fmt = (p) => Number(p) === 0 ? 'FREE' : `KES ${Number(p).toLocaleString()}`;
const fmtDate = (ds) => ds ? new Date(ds).toLocaleString('en', { weekday: 'short', month: 'short', day: 'numeric' }) : '—';

export default function AttendeeDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tickets, setTickets]   = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    getMyTickets()
      .then((res) => setTickets(res.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const firstName    = user?.fullName?.split(' ')[0] || 'there';
  const upcoming     = tickets.filter((t) => new Date(t.ticket?.event?.eventDate) >= new Date());
  const totalSpent   = tickets.reduce((sum, t) => sum + Number(t.totalAmount), 0);

  const stats = [
    { label: 'Total Tickets',    value: loading ? '—' : tickets.length,  icon: '🎟️' },
    { label: 'Upcoming Events',  value: loading ? '—' : upcoming.length, icon: '📅' },
    { label: 'Total Spent',      value: loading ? '—' : fmt(totalSpent),  icon: '💳' },
  ];

  const quickLinks = [
    { label: 'Browse Events',  icon: '🔍', route: ROUTES.EVENTS },
    { label: 'My Tickets',     icon: '🎫', route: ROUTES.TICKETS },
    { label: 'Profile',        icon: '👤', route: ROUTES.PROFILE },
  ];

  return (
    <>
      <Navbar />

      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, var(--primary) 0%, #0E5A43 100%)', padding: '48px 0 36px' }}>
        <div className="container">
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px', marginBottom: '6px' }}>Welcome back</p>
          <h1 style={{ color: '#fff', fontSize: '30px', fontWeight: 800, marginBottom: '4px' }}>
            Hey, {firstName} 👋
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '14px' }}>
            Here's what's happening with your events
          </p>
        </div>
      </div>

      <div className="container" style={{ padding: '36px 24px 80px' }}>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '36px' }}>
          {stats.map(({ label, value, icon }) => (
            <div key={label} style={{ background: '#fff', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '22px 24px', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ fontSize: '26px', marginBottom: '10px' }}>{icon}</div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--primary)', marginBottom: '4px' }}>{value}</div>
              <div style={{ fontSize: '13px', color: 'var(--muted)', fontWeight: 500 }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Quick Links */}
        <div style={{ marginBottom: '36px' }}>
          <h2 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--primary)', marginBottom: '14px' }}>Quick Actions</h2>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {quickLinks.map(({ label, icon, route }) => (
              <button
                key={label}
                className="btn btn-outline"
                onClick={() => navigate(route)}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px' }}
              >
                <span>{icon}</span> {label}
              </button>
            ))}
          </div>
        </div>

        {/* Recent Tickets */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--primary)' }}>Recent Tickets</h2>
            <button className="btn btn-outline btn-sm" onClick={() => navigate(ROUTES.TICKETS)}>View all</button>
          </div>

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[1, 2, 3].map((i) => <div key={i} className="skeleton" style={{ height: '80px', borderRadius: 'var(--radius-md)' }} />)}
            </div>
          ) : tickets.length === 0 ? (
            <div style={{ background: '#fff', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '48px 24px', textAlign: 'center', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>🎟️</div>
              <h3 style={{ fontWeight: 700, fontSize: '16px', marginBottom: '8px' }}>No tickets yet</h3>
              <p style={{ color: 'var(--muted)', fontSize: '14px', marginBottom: '20px' }}>
                Browse events and book your first ticket!
              </p>
              <button className="btn btn-primary" onClick={() => navigate(ROUTES.EVENTS)}>
                Explore Events
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {tickets.slice(0, 5).map((order) => {
                const ev = order.ticket?.event;
                const isConfirmed = order.status === 'CONFIRMED';
                return (
                  <div
                    key={order.id}
                    onClick={() => navigate(ROUTES.TICKETS)}
                    style={{ background: '#fff', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer', boxShadow: 'var(--shadow-sm)', transition: 'box-shadow var(--transition)' }}
                  >
                    <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'linear-gradient(135deg, var(--primary), #0E5A43)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '18px', flexShrink: 0 }}>
                      🎟️
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text)', marginBottom: '3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {ev?.title || 'Event'}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--muted)' }}>
                        {fmtDate(ev?.eventDate)} · {ev?.venue || '—'}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--accent)' }}>{fmt(order.totalAmount)}</div>
                      <div style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '999px', marginTop: '4px', background: isConfirmed ? 'transparent' : '#fff', border: isConfirmed ? 'none' : '1px solid #c7d2fe', color: isConfirmed ? '#0E7257' : '#4F46E5' }}>
                        {order.status}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <Footer />
    </>
  );
}
