import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import { createOrder, getOrderStatus, initiateMpesaPay } from '../../lib/api';
import { ROUTES } from '../../config/routes';
import { useAuth } from '../../hooks/useAuth';

const CheckIcon = () => (
  <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
    <polyline points="22 4 12 14.01 9 11.01"/>
  </svg>
);

const ErrorIcon = () => (
  <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="15" x2="9" y1="9" y2="15"/>
    <line x1="9" x2="15" y1="9" y2="15"/>
  </svg>
);

export default function CheckoutPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const ticketId = searchParams.get('ticketId');
  const quantity  = searchParams.get('quantity');

  const [order,          setOrder]          = useState(null);
  const [loading,        setLoading]        = useState(true);
  const [creating,       setCreating]       = useState(false);
  const [phone,          setPhone]          = useState(user?.phone || '');
  const [paymentStatus,  setPaymentStatus]  = useState('idle'); // idle | paying | polling | success | failed
  const [paymentMessage, setPaymentMessage] = useState('');
  const [error,          setError]          = useState(null);

  const pollRef = useRef(null);

  useEffect(() => {
    if (!ticketId || !quantity) {
      setError('Invalid checkout parameters — ticket or quantity is missing.');
      setLoading(false);
      return;
    }

    createOrder({ ticketId: parseInt(ticketId, 10), quantity: parseInt(quantity, 10) })
      .then((res) => setOrder(res.data))
      .catch((err) => setError(err.message || 'Failed to create order. Please try again.'))
      .finally(() => setLoading(false));

    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [ticketId, quantity]);

  const handlePhoneChange = (e) => setPhone(e.target.value.replace(/[^\d+]/g, ''));

  const handlePay = async (e) => {
    e.preventDefault();
    if (!order || !phone) return;

    let p = phone.trim().replace(/\s/g, '');
    if (p.startsWith('0'))                         p = '254' + p.slice(1);
    else if (p.startsWith('+'))                    p = p.slice(1);
    else if (p.startsWith('7') || p.startsWith('1')) p = '254' + p;

    if (!/^254(7|1)\d{8}$/.test(p)) {
      setPaymentMessage('Please enter a valid M-Pesa number (e.g. 0712 345 678).');
      return;
    }

    setCreating(true);
    setPaymentStatus('paying');
    setPaymentMessage('Initiating M-Pesa STK Push...');

    try {
      await initiateMpesaPay({ orderId: order.id, phone: p });
      setPaymentStatus('polling');
      setPaymentMessage('STK Push sent — check your phone for the payment prompt, then enter your PIN.');

      pollRef.current = setInterval(async () => {
        try {
          const res = await getOrderStatus(order.id);
          const o   = res.data;
          if (o.status === 'CONFIRMED') {
            clearInterval(pollRef.current);
            setPaymentStatus('success');
          } else if (o.status === 'FAILED') {
            clearInterval(pollRef.current);
            setPaymentStatus('failed');
            setPaymentMessage('Payment was declined or timed out. Please try again.');
          }
        } catch (err) { console.error('[poll]', err); }
      }, 3000);

    } catch (err) {
      setPaymentStatus('idle');
      setPaymentMessage(err.message || 'Could not initiate payment. Try again.');
    } finally {
      setCreating(false);
    }
  };

  const fmtPrice = (p) => `KES ${Number(p).toLocaleString()}`;
  const fmtDate  = (ds) => ds ? new Date(ds).toLocaleString('en', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) : '';

  /* ── Loading ── */
  if (loading) return (
    <>
      <Navbar />
      <div style={{ padding: '60px 24px', maxWidth: 600, margin: '0 auto' }}>
        {[240, 140, 48].map((h, i) => (
          <div key={i} className="skeleton" style={{ height: h, borderRadius: 10, marginBottom: 20 }} />
        ))}
      </div>
      <Footer />
    </>
  );

  /* ── Error / No order ── */
  if (error || !order) return (
    <>
      <Navbar />
      <div style={{ padding: '80px 24px', maxWidth: 560, margin: '0 auto', textAlign: 'center' }}>
        <div style={{ color: '#ef4444', display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
          <ErrorIcon />
        </div>
        <h2 style={{ fontWeight: 800, fontSize: 22, color: '#0f172a', marginBottom: 10 }}>Checkout Error</h2>
        <p style={{ color: '#64748b', marginBottom: 28, lineHeight: 1.6 }}>
          {error || 'Could not initiate checkout. The ticket may be sold out or unavailable.'}
        </p>
        <button className="btn btn-primary" onClick={() => navigate(ROUTES.EVENTS)}>
          Browse Events
        </button>
      </div>
      <Footer />
    </>
  );

  /* ── Main checkout ── */
  return (
    <>
      <Navbar />

      <div style={{ background: '#f8fafc', minHeight: 'calc(100vh - 64px)' }}>
        {/* Header */}
        <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', padding: '40px 0' }}>
          <div className="container" style={{ maxWidth: 680 }}>
            <h1 style={{ color: '#fff', fontSize: 26, fontWeight: 800, margin: 0 }}>Secure Checkout</h1>
            <p style={{ color: '#94a3b8', marginTop: 6, margin: 0, fontSize: 14 }}>
              Review your order and complete payment via M-Pesa
            </p>
          </div>
        </div>

        <div className="container" style={{ maxWidth: 680, padding: '36px 20px 80px' }}>

          {/* ── SUCCESS STATE ── */}
          {paymentStatus === 'success' && (
            <div style={{
              background: '#fff',
              border: '1.5px solid #10b981',
              borderRadius: 16,
              padding: '48px 32px',
              textAlign: 'center',
              boxShadow: '0 4px 20px rgb(16 185 129 / 0.1)'
            }}>
              <div style={{ color: '#10b981', display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
                <CheckIcon />
              </div>
              <h2 style={{ fontWeight: 800, fontSize: 22, color: '#0f172a', marginBottom: 8 }}>Payment Confirmed!</h2>
              <p style={{ color: '#64748b', marginBottom: 32, lineHeight: 1.6 }}>
                Your payment of <strong>{fmtPrice(order.totalAmount)}</strong> was received. Your digital tickets are ready.
              </p>
              <button
                className="btn btn-primary"
                style={{ padding: '12px 32px' }}
                onClick={() => navigate(ROUTES.TICKETS)}
              >
                View My Tickets
              </button>
            </div>
          )}

          {/* ── CHECKOUT FORM ── */}
          {paymentStatus !== 'success' && (
            <div style={{
              background: '#fff',
              border: '1px solid #e2e8f0',
              borderRadius: 16,
              boxShadow: '0 1px 3px rgb(0 0 0 / 0.05)',
              overflow: 'hidden'
            }}>
              {/* Order Summary */}
              <div style={{ padding: '24px 28px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>
                  Order Summary
                </div>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', margin: '0 0 6px' }}>
                  {order.ticket?.event?.title || 'Event Ticket'}
                </h2>
                <p style={{ color: '#64748b', fontSize: 13, margin: 0 }}>
                  {fmtDate(order.ticket?.event?.eventDate)}
                  {order.ticket?.event?.eventTime && ` · ${order.ticket.event.eventTime}`}
                  {order.ticket?.event?.venue && ` · ${order.ticket.event.venue}`}
                </p>
              </div>

              {/* Price Breakdown */}
              <div style={{ padding: '20px 28px', borderBottom: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ color: '#64748b', fontSize: 14 }}>{order.ticket?.ticketType || 'Regular'} Ticket</span>
                  <span style={{ fontWeight: 600, fontSize: 14 }}>{fmtPrice(order.ticket?.price || 0)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                  <span style={{ color: '#64748b', fontSize: 14 }}>Quantity</span>
                  <span style={{ fontWeight: 600, fontSize: 14 }}>x{order.quantity}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTop: '1px dashed #e2e8f0' }}>
                  <span style={{ fontWeight: 700, fontSize: 16, color: '#0f172a' }}>Total</span>
                  <span style={{ fontWeight: 800, fontSize: 22, color: '#2563eb' }}>{fmtPrice(order.totalAmount)}</span>
                </div>
              </div>

              {/* Payment Section */}
              <div style={{ padding: '24px 28px' }}>
                {(paymentStatus === 'idle' || paymentStatus === 'failed') && (
                  <form onSubmit={handlePay}>
                    <label style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 8 }}>
                      M-Pesa Phone Number
                    </label>
                    <input
                      type="tel"
                      id="mpesa-phone"
                      placeholder="e.g. 0712 345 678"
                      value={phone}
                      onChange={handlePhoneChange}
                      required
                      style={{
                        width: '100%',
                        padding: '12px 14px',
                        borderRadius: 8,
                        border: '1.5px solid #e2e8f0',
                        outline: 'none',
                        fontSize: 15,
                        fontFamily: 'inherit',
                        boxSizing: 'border-box',
                        marginBottom: 6
                      }}
                    />
                    <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 20 }}>
                      A payment prompt will be sent to this number. Enter your M-Pesa PIN to complete.
                    </p>

                    {paymentMessage && (
                      <div style={{
                        background: '#fef2f2',
                        border: '1px solid #fca5a5',
                        borderRadius: 8,
                        padding: '10px 14px',
                        color: '#ef4444',
                        fontSize: 13,
                        marginBottom: 16
                      }}>
                        {paymentMessage}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={creating || !phone}
                      style={{
                        width: '100%',
                        padding: '14px',
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 8,
                        fontWeight: 700,
                        fontSize: 15,
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                        opacity: creating || !phone ? 0.6 : 1
                      }}
                    >
                      {creating ? 'Processing...' : `Pay ${fmtPrice(order.totalAmount)} via M-Pesa`}
                    </button>
                  </form>
                )}

                {(paymentStatus === 'paying' || paymentStatus === 'polling') && (
                  <div style={{ textAlign: 'center', padding: '24px 0' }}>
                    <div style={{
                      width: 44,
                      height: 44,
                      border: '3px solid #e2e8f0',
                      borderTop: '3px solid #10b981',
                      borderRadius: '50%',
                      margin: '0 auto 20px',
                      animation: 'spin 1s linear infinite'
                    }} />
                    <h4 style={{ fontWeight: 700, fontSize: 16, color: '#0f172a', marginBottom: 8 }}>
                      {paymentStatus === 'paying' ? 'Sending payment request...' : 'Waiting for payment confirmation...'}
                    </h4>
                    <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.6, maxWidth: 380, margin: '0 auto 24px' }}>
                      {paymentMessage}
                    </p>
                    {paymentStatus === 'polling' && (
                      <button
                        onClick={() => { if (pollRef.current) clearInterval(pollRef.current); setPaymentStatus('idle'); setPaymentMessage(''); }}
                        style={{
                          padding: '8px 20px',
                          border: '1.5px solid #e2e8f0',
                          borderRadius: 8,
                          background: '#fff',
                          color: '#475569',
                          fontWeight: 600,
                          cursor: 'pointer',
                          fontSize: 13,
                          fontFamily: 'inherit'
                        }}
                      >
                        Cancel &amp; Try Again
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <Footer />
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </>
  );
}
