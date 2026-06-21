import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthBrandPanel from '../../components/auth/AuthBrandPanel';
import PasswordInput from '../../components/auth/PasswordInput';
import PasswordStrength from '../../components/auth/PasswordStrength';
import RolePicker from '../../components/auth/RolePicker';
import { registerUser } from '../../lib/api';
import { validateEmail, validatePhone, formatPhone } from '../../lib/utils';
import { ROUTES } from '../../config/routes';

export default function SignupPage() {
  const navigate = useNavigate();

  const [role, setRole]             = useState('ATTENDEE');
  const [fullName, setFullName]     = useState('');
  const [email, setEmail]           = useState('');
  const [phone, setPhone]           = useState('');
  const [password, setPassword]     = useState('');
  const [confirm, setConfirm]       = useState('');
  const [agreed, setAgreed]         = useState(false);
  const [alert, setAlert]           = useState({ msg: '', type: '' });
  const [loading, setLoading]       = useState(false);

  const showAlert = (msg, type = 'error') => setAlert({ msg, type });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAlert({ msg: '', type: '' });

    if (!fullName || fullName.length < 2)   return showAlert('Please enter your full name (at least 2 characters).');
    if (!email)                              return showAlert('Please enter your email address.');
    if (!validateEmail(email))               return showAlert('Please enter a valid email address.');
    if (phone && !validatePhone(phone))      return showAlert('Please enter a valid Kenyan phone number (e.g. 0712 345678).');
    if (!password)                           return showAlert('Please create a password.');
    if (password.length < 8)                 return showAlert('Password must be at least 8 characters long.');
    if (password !== confirm)                return showAlert('Passwords do not match.');
    if (!agreed)                             return showAlert('Please agree to our Terms of Service to continue.');

    setLoading(true);
    try {
      await registerUser({
        fullName,
        email,
        password,
        phone: phone ? formatPhone(phone) : undefined,
        role,
      });
      showAlert('✓ Account created! Redirecting to login…', 'success');
      setTimeout(() => navigate(`${ROUTES.LOGIN}?registered=1`), 1200);
    } catch (err) {
      showAlert(err?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <AuthBrandPanel variant="signup" />

      <div className="auth-form-side">
        <div className="auth-form-wrap">
          <Link to={ROUTES.HOME} className="auth-form-logo">
            <img src="/images/hafla-logo.png" alt="Hafla" className="auth-form-logo-img" />
          </Link>

          <h1>Create your account</h1>
          <p className="auth-sub">
            Already have an account? <Link to={ROUTES.LOGIN}>Sign in here</Link>
          </p>

          {alert.msg && (
            <div className={`auth-alert ${alert.type} show`} role="alert">{alert.msg}</div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label className="form-label">I want to…</label>
              <RolePicker value={role} onChange={setRole} />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="fullName">Full name</label>
              <input className="form-input" type="text" id="fullName" placeholder="e.g. Alvin Kyalo" autoComplete="name" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="signup-email">Email address</label>
              <input className="form-input" type="email" id="signup-email" placeholder="you@example.com" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="phone">
                Phone number <span style={{ fontWeight: 400, color: 'var(--muted)', fontSize: 12 }}>(optional — for M-Pesa)</span>
              </label>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <div className="phone-prefix">🇰🇪 +254</div>
                <input className="form-input" type="tel" id="phone" placeholder="7XX XXX XXX" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} style={{ flex: 1 }} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="signup-password">Password</label>
              <PasswordInput id="signup-password" name="password" placeholder="At least 8 characters" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
              <PasswordStrength password={password} />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="confirm">Confirm password</label>
              <PasswordInput id="confirm" name="confirmPassword" placeholder="Re-enter your password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
            </div>

            <div className="form-group" style={{ display: 'flex', alignItems: 'flex-start', gap: 9, marginBottom: 24 }}>
              <input type="checkbox" id="terms" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} style={{ accentColor: 'var(--accent)', width: 16, height: 16, marginTop: 2, cursor: 'pointer', flexShrink: 0 }} />
              <label htmlFor="terms" style={{ fontSize: 13, color: 'var(--muted)', cursor: 'pointer', lineHeight: 1.5 }}>
                I agree to Mombasa Tickets' <a href="#" style={{ color: 'var(--accent)' }}>Terms of Service</a> and <a href="#" style={{ color: 'var(--accent)' }}>Privacy Policy</a>
              </label>
            </div>

            <button type="submit" className="auth-submit" disabled={loading}>
              {loading ? <span className="btn-spinner" /> : 'Create Account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
