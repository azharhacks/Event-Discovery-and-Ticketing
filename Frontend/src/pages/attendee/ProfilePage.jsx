import { useState, useEffect } from 'react';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import { getUserProfile, updateUserProfile } from '../../lib/api';

export default function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ fullName: '', phone: '' });

  useEffect(() => {
    getUserProfile()
      .then((r) => {
        const p = r.data;
        setProfile(p);
        setForm({ fullName: p.fullName || '', phone: p.phone || '' });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.fullName.trim()) { setError('Full name is required.'); return; }
    setError(''); setSaving(true); setSuccess(false);
    try {
      const r = await updateUserProfile(form);
      setProfile(r.data);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const initials = (profile?.fullName || 'U').split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  const roleColors = {
    ADMIN:     { bg: 'transparent', color: '#dc2626' },
    ORGANIZER: { bg: 'transparent', color: '#9C6B1F' },
    ATTENDEE:  { bg: 'transparent', color: '#128C6B' },
  };
  const rc = roleColors[profile?.role] || { bg: 'transparent', color: '#66766C' };
  const fs = {
    width: '100%', padding: '12px 14px',
    borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--border)',
    outline: 'none', fontSize: '15px', fontFamily: 'inherit',
  };
  const ls = {
    fontSize: '12px', fontWeight: 700, color: 'var(--muted)',
    textTransform: 'uppercase', letterSpacing: '0.5px',
    display: 'block', marginBottom: '8px',
  };

  return (
    <>
      <Navbar />
      <div style={{ background: 'linear-gradient(135deg,var(--primary) 0%,#0E5A43 100%)', padding: '40px 0' }}>
        <div className="container">
          <h1 style={{ color: '#fff', fontSize: '28px', fontWeight: 800 }}>My Profile</h1>
          <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '14px', marginTop: '4px' }}>Manage your account details</p>
        </div>
      </div>

      <div className="container" style={{ maxWidth: '640px', padding: '48px 24px 80px' }}>
        {loading ? (
          <div>
            <div className="skeleton" style={{ height: '120px', borderRadius: 'var(--radius-lg)', marginBottom: '20px' }} />
            <div className="skeleton" style={{ height: '260px', borderRadius: 'var(--radius-lg)' }} />
          </div>
        ) : (
          <>
            <div className="fade-up" style={{
              background: '#fff', border: '1.5px solid var(--border)',
              borderRadius: 'var(--radius-lg)', padding: '28px', marginBottom: '20px',
              boxShadow: 'var(--shadow-sm)', display: 'flex', alignItems: 'center', gap: '20px',
            }}>
              <div style={{
                width: '72px', height: '72px', borderRadius: '50%',
                background: 'linear-gradient(135deg,var(--primary),#0E5A43)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontWeight: 800, fontSize: '24px', flexShrink: 0,
              }}>{initials}</div>
              <div>
                <h2 style={{ fontWeight: 800, fontSize: '20px', marginBottom: '4px' }}>{profile?.fullName}</h2>
                <p style={{ color: 'var(--muted)', fontSize: '14px', marginBottom: '8px' }}>{profile?.email}</p>
                <span style={{
                  display: 'inline-flex', padding: '4px 12px', borderRadius: '999px',
                  fontSize: '12px', fontWeight: 700, background: rc.bg, color: rc.color,
                }}>{profile?.role}</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="fade-up">
              <div style={{ background: '#fff', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '28px', boxShadow: 'var(--shadow-sm)' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--primary)', marginBottom: '20px' }}>Edit Information</h3>
                {error && (
                  <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 'var(--radius-sm)', padding: '12px 16px', color: '#ef4444', fontSize: '14px', marginBottom: '20px' }}>{error}</div>
                )}
                {success && (
                  <div style={{ background: '#E8F5EE', border: '1px solid #A7DDC4', borderRadius: 'var(--radius-sm)', padding: '12px 16px', color: '#0E7257', fontSize: '14px', marginBottom: '20px' }}>Profile updated successfully!</div>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', marginBottom: '24px' }}>
                  <div>
                    <label style={ls}>Full Name *</label>
                    <input name="fullName" style={fs} value={form.fullName} onChange={handleChange} required />
                  </div>
                  <div>
                    <label style={ls}>Phone Number</label>
                    <input name="phone" style={fs} value={form.phone} onChange={handleChange} placeholder="+254 7XX XXX XXX" />
                  </div>
                  <div>
                    <label style={ls}>Email Address</label>
                    <input style={{ ...fs, background: 'var(--light)', color: 'var(--muted)' }} value={profile?.email || ''} disabled />
                    <p style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '6px' }}>Email cannot be changed. Contact support for help.</p>
                  </div>
                </div>
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {[
                    ['Member Since', profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('en', { month: 'long', day: 'numeric', year: 'numeric' }) : '—'],
                    ['Account Status', profile?.verified ? 'Verified' : 'Unverified'],
                  ].map(([label, val]) => (
                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                      <span style={{ color: 'var(--muted)' }}>{label}</span>
                      <span style={{ fontWeight: 600, color: 'var(--text)' }}>{val}</span>
                    </div>
                  ))}
                </div>
              </div>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'center', marginTop: '16px' }}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          </>
        )}
      </div>
      <Footer />
    </>
  );
}
