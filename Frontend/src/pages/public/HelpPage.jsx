import { Link } from 'react-router-dom';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import { ROUTES } from '../../config/routes';

const FAQ = [
  {
    q: 'How do I buy a ticket?',
    a: 'Browse events, open an event you like, choose your ticket quantity, and complete checkout. Free events confirm instantly; paid events use M-Pesa or demo payment in development.',
  },
  {
    q: 'Where is my ticket after purchase?',
    a: 'Go to My Tickets from the user menu. Tap a ticket to view your QR code, or download a full ticket image with event details.',
  },
  {
    q: 'How does login work?',
    a: 'Sign in with your email and password. A one-time code is sent to your email (or printed in the backend terminal during local development). Enter that code to finish signing in.',
  },
  {
    q: 'I want to host an event — how do I start?',
    a: 'Sign up as an Organizer, then use Create Event from your dashboard. Events are reviewed by an admin before going live.',
  },
  {
    q: 'How do organizers check in attendees?',
    a: 'Open the Organizer Dashboard and use the Ticket Verifier — scan the attendee\'s QR code or paste the token to validate entry.',
  },
  {
    q: 'Can I get a refund?',
    a: 'Refunds are handled by platform admins. Contact support with your order details if you need help.',
  },
];

export default function HelpPage() {
  return (
    <>
      <Navbar />
      <div style={{ background: 'linear-gradient(135deg, #0B3D2E 0%, #0E5A43 100%)', padding: '48px 0' }}>
        <div className="container">
          <h1 style={{ color: '#fff', fontSize: 28, fontWeight: 800, margin: 0 }}>Help Center</h1>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, marginTop: 8 }}>
            Answers to common questions about Hafla
          </p>
        </div>
      </div>

      <div className="container" style={{ padding: '48px 24px 80px', maxWidth: 720 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {FAQ.map(({ q, a }) => (
            <div key={q} style={{ background: '#fff', border: '1px solid #E3DFD2', borderRadius: 12, padding: '20px 24px' }}>
              <h3 style={{ fontWeight: 700, fontSize: 15, color: '#0B3D2E', margin: '0 0 8px' }}>{q}</h3>
              <p style={{ fontSize: 14, color: '#4A5950', lineHeight: 1.6, margin: 0 }}>{a}</p>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 40, padding: 24, background: '#FAF8F3', borderRadius: 12, border: '1px solid #E3DFD2', textAlign: 'center' }}>
          <p style={{ fontSize: 14, color: '#66766C', margin: '0 0 16px' }}>Still need help?</p>
          <Link to={ROUTES.EVENTS} className="btn btn-primary" style={{ marginRight: 12 }}>Browse Events</Link>
          <Link to={ROUTES.SIGNUP} className="btn btn-outline">Create an Account</Link>
        </div>
      </div>
      <Footer />
    </>
  );
}
