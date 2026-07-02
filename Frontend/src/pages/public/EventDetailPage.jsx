import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import { getEvent } from '../../lib/api';
import { getEventImageUrl } from '../../lib/images';
import { ROUTES } from '../../config/routes';
import { useAuth } from '../../hooks/useAuth';

export default function EventDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getEvent(id)
      .then((res) => {
        const ev = res.data;
        setEvent(ev);
        if (ev && ev.tickets && ev.tickets.length > 0) {
          // Select default ticket tier (prefer REGULAR)
          const defTicket = ev.tickets.find(t => t.ticketType === 'REGULAR') || ev.tickets[0];
          setSelectedTicket(defTicket);
        }
      })
      .catch((err) => {
        console.error(err);
        setError('Failed to fetch event details. It may not exist or has been removed.');
      })
      .finally(() => setLoading(false));
  }, [id]);

  const fmtPrice = (p) => Number(p) === 0 ? 'FREE' : `KES ${Number(p).toLocaleString()}`;
  const fmtDate = (ds) => {
    if (!ds) return '';
    const d = new Date(ds);
    return d.toLocaleString('en', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  const handleCheckout = () => {
    if (!selectedTicket) return;
    const checkoutUrl = `/checkout?ticketId=${selectedTicket.id}&quantity=${quantity}`;
    if (!isLoggedIn) {
      navigate(`${ROUTES.LOGIN}?redirect=${encodeURIComponent(checkoutUrl)}`);
      return;
    }
    navigate(checkoutUrl);
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="container" style={{ padding: '60px 24px' }}>
          <div className="skeleton" style={{ height: '360px', borderRadius: '16px', marginBottom: '28px' }}></div>
          <div className="skeleton" style={{ height: '32px', width: '60%', marginBottom: '16px' }}></div>
          <div className="skeleton" style={{ height: '16px', width: '30%', marginBottom: '24px' }}></div>
          <div className="skeleton" style={{ height: '120px', width: '100%', marginBottom: '28px' }}></div>
        </div>
        <Footer />
      </>
    );
  }

  if (error || !event) {
    return (
      <>
        <Navbar />
        <div className="container" style={{ padding: '80px 24px', textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20, color: '#8A968D' }}>
            <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" x2="12" y1="8" y2="12"/>
              <line x1="12" x2="12.01" y1="16" y2="16"/>
            </svg>
          </div>
          <h2 style={{ fontWeight: 800 }}>Event Not Found</h2>
          <p style={{ color: 'var(--muted)', marginTop: 8, maxWidth: 500, margin: '8px auto 28px' }}>
            {error || 'The event you are looking for does not exist or has been removed.'}
          </p>
          <button className="btn btn-primary" onClick={() => navigate(ROUTES.EVENTS)}>
            Browse All Events
          </button>
        </div>
        <Footer />
      </>
    );
  }

  const isSoldOut = selectedTicket && selectedTicket.quantityAvailable <= 0;
  const bannerImage = getEventImageUrl(event);

  return (
    <>
      <Navbar />
      
      {/* Event Details Layout */}
      <div className="container" style={{ padding: '36px 24px 72px' }}>
        
        {/* Breadcrumb */}
        <button 
          onClick={() => navigate(ROUTES.EVENTS)} 
          style={{ 
            background: 'none', 
            border: 'none', 
            color: 'var(--muted)', 
            fontSize: '14px', 
            fontWeight: 500, 
            display: 'flex', 
            alignItems: 'center', 
            gap: '6px', 
            marginBottom: '20px',
            cursor: 'pointer'
          }}
        >
          ← Back to Explore
        </button>

        {event.status !== 'APPROVED' && (
          <div style={{
            background: event.status === 'PENDING' ? '#fffbeb' : event.status === 'REJECTED' ? '#fef2f2' : '#FAF8F3',
            border: `1.5px solid ${event.status === 'PENDING' ? '#fde68a' : event.status === 'REJECTED' ? '#fca5a5' : '#E3DFD2'}`,
            borderRadius: 'var(--radius-sm)',
            padding: '16px 20px',
            marginBottom: '24px',
            color: event.status === 'PENDING' ? '#b45309' : event.status === 'REJECTED' ? '#b91c1c' : '#4A5950',
            fontSize: '14px',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" x2="12" y1="8" y2="12"/>
              <line x1="12" x2="12.01" y1="16" y2="16"/>
            </svg>
            <div>
              <strong style={{ textTransform: 'capitalize' }}>Event {event.status.toLowerCase()}</strong> — {
                event.status === 'PENDING' 
                  ? 'This event is currently pending approval. Only the organizer and administrators can view this page.' 
                  : event.status === 'REJECTED' 
                  ? 'This event has been rejected by the administrators.' 
                  : 'This event has been cancelled.'
              }
            </div>
          </div>
        )}

        {/* Hero banner */}
        <div 
          className="fade-up"
          style={{ 
            position: 'relative', 
            height: '400px', 
            borderRadius: 'var(--radius-lg)', 
            overflow: 'hidden', 
            marginBottom: '36px',
            boxShadow: 'var(--shadow-md)',
            background: 'var(--primary)'
          }}
        >
          {bannerImage ? (
            <img 
              src={bannerImage} 
              alt={event.title} 
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
            />
          ) : (
            <div 
              style={{ 
                width: '100%', 
                height: '100%', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                background: 'linear-gradient(135deg, #0B3D2E 0%, #1e3a5f 100%)',
                color: 'rgba(255,255,255,0.15)'
              }}
            >
              <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/>
                <path d="M13 5v14"/>
              </svg>
            </div>
          )}
          <span 
            className="event-badge badge-featured" 
            style={{ position: 'absolute', top: 20, left: 20, fontSize: '13px', padding: '6px 14px' }}
          >
            {event.category?.name || 'Event'}
          </span>
        </div>

        {/* Info Grid */}
        <div 
          className="fade-up"
          style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 360px', 
            gap: '36px',
            alignItems: 'start'
          }}
        >
          {/* Main Info */}
          <div>
            <h1 style={{ fontSize: '32px', fontWeight: 800, color: 'var(--primary)', lineHeight: 1.2, marginBottom: '16px' }}>
              {event.title}
            </h1>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px' }}>
              {/* Date & Time */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ 
                  background: 'var(--light)', 
                  width: '40px', 
                  height: '40px', 
                  borderRadius: '50%', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  color: 'var(--accent)'
                }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text)' }}>
                    {fmtDate(event.eventDate)}
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--muted)' }}>
                    {event.eventTime}
                  </div>
                </div>
              </div>

              {/* Venue */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ 
                  background: 'var(--light)', 
                  width: '40px', 
                  height: '40px', 
                  borderRadius: '50%', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  color: 'var(--accent)'
                }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text)' }}>
                    {event.venue}
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--muted)' }}>
                    Mombasa, Kenya
                  </div>
                </div>
              </div>

              {/* Organiser */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ 
                  background: 'var(--light)', 
                  width: '40px', 
                  height: '40px', 
                  borderRadius: '50%', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  color: 'var(--accent)'
                }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text)' }}>
                    Hosted by {event.organiser?.fullName}
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--muted)' }}>
                    {event.organiser?.email}
                  </div>
                </div>
              </div>
            </div>

            {/* Event Description */}
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '28px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--primary)', marginBottom: '12px' }}>
                About the Event
              </h3>
              <p style={{ color: 'var(--text)', fontSize: '15px', lineHeight: '1.7', whiteSpace: 'pre-line' }}>
                {event.description}
              </p>
            </div>
          </div>

          {/* Ticket Picker Sidebar */}
          <div 
            style={{ 
              background: '#fff', 
              border: '1.5px solid var(--border)', 
              borderRadius: 'var(--radius-lg)', 
              padding: '24px',
              position: 'sticky',
              top: '90px',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--primary)', marginBottom: '16px' }}>
              Get Tickets
            </h3>

            {event.tickets && event.tickets.length > 0 ? (
              <>
                {/* Select Ticket Tier */}
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--muted)', display: 'block', textTransform: 'uppercase', marginBottom: '8px' }}>
                    Select Ticket Type
                  </label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {event.tickets.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => setSelectedTicket(t)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'between',
                          padding: '12px 14px',
                          borderRadius: 'var(--radius-sm)',
                          border: `2px solid ${selectedTicket?.id === t.id ? 'var(--accent)' : 'var(--border)'}`,
                          background: selectedTicket?.id === t.id ? 'var(--bg)' : '#fff',
                          cursor: 'pointer',
                          textAlign: 'left',
                          width: '100%',
                          transition: 'all var(--transition)'
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text)' }}>
                            {t.ticketType}
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--muted)' }}>
                            {t.quantityAvailable > 0 ? `${t.quantityAvailable} left` : 'Sold out'}
                          </div>
                        </div>
                        <div style={{ fontWeight: 800, fontSize: '15px', color: 'var(--primary)' }}>
                          {fmtPrice(t.price)}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Select Quantity */}
                {selectedTicket && !isSoldOut && (
                  <div style={{ marginBottom: '24px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--muted)', display: 'block', textTransform: 'uppercase', marginBottom: '8px' }}>
                      Quantity
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <button 
                        className="btn btn-outline" 
                        style={{ padding: '6px 12px', borderRadius: '4px', minWidth: '36px' }}
                        disabled={quantity <= 1}
                        onClick={() => setQuantity(q => q - 1)}
                      >-</button>
                      <span style={{ fontSize: '16px', fontWeight: 700, minWidth: '24px', textAlign: 'center' }}>
                        {quantity}
                      </span>
                      <button 
                        className="btn btn-outline" 
                        style={{ padding: '6px 12px', borderRadius: '4px', minWidth: '36px' }}
                        disabled={quantity >= Math.min(10, selectedTicket.quantityAvailable)}
                        onClick={() => setQuantity(q => q + 1)}
                      >+</button>
                    </div>
                  </div>
                )}

                {/* Pricing Summary */}
                {selectedTicket && !isSoldOut && (
                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', marginBottom: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ color: 'var(--muted)', fontSize: '14px' }}>Ticket Price</span>
                      <span style={{ fontWeight: 600, fontSize: '14px' }}>{fmtPrice(selectedTicket.price)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <span style={{ color: 'var(--muted)', fontSize: '14px' }}>Quantity</span>
                      <span style={{ fontWeight: 600, fontSize: '14px' }}>x{quantity}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 700, fontSize: '15px' }}>Total</span>
                      <span style={{ fontWeight: 800, fontSize: '18px', color: 'var(--accent)' }}>
                        {fmtPrice(parseFloat(selectedTicket.price) * quantity)}
                      </span>
                    </div>
                  </div>
                )}

                {/* Checkout Trigger */}
                <button
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '12px', borderRadius: 'var(--radius-sm)', justifyContent: 'center' }}
                  disabled={!selectedTicket || isSoldOut}
                  onClick={handleCheckout}
                >
                  {isSoldOut ? 'SOLD OUT' : 'BOOK NOW'}
                </button>
              </>
            ) : (
              <p style={{ color: 'var(--muted)', fontSize: '13px', textAlign: 'center', padding: '12px 0' }}>
                No ticket tiers available for this event yet.
              </p>
            )}
          </div>
        </div>

      </div>

      <Footer />
    </>
  );
}
