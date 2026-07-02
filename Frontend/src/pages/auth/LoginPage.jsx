import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import AuthBrandPanel from '../../components/auth/AuthBrandPanel';
import PasswordInput from '../../components/auth/PasswordInput';
import { loginUser, verifyOtp } from '../../lib/api';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { validateEmail } from '../../lib/utils';
import { ROUTES } from '../../config/routes';

export default function LoginPage() {
  const { login, isLoggedIn } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get('redirect');

  const [step, setStep]         = useState('credentials'); // 'credentials' | 'otp'
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [userId, setUserId]     = useState('');
  const [otp, setOtp]           = useState(['', '', '', '', '', '']);
  const [alert, setAlert]       = useState({ msg: '', type: '' });
  const [loading, setLoading]   = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const otpRefs = useRef([]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setInterval(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearInterval(t);
  }, [resendCooldown]);

  if (isLoggedIn) {
    navigate(redirectTo || ROUTES.HOME, { replace: true });
    return null;
  }

  const showAlert = (msg, type = 'error') => setAlert({ msg, type });

  // ── Step 1: submit email + password ──
  const handleCredentials = async (e) => {
    e.preventDefault();
    setAlert({ msg: '', type: '' });

    if (!email)               return showAlert('Please enter your email address.');
    if (!validateEmail(email)) return showAlert('Please enter a valid email address.');
    if (!password)            return showAlert('Please enter your password.');

    setLoading(true);
    try {
      const res = await loginUser({ email, password });
      if (res.requiresOtp) {
        setUserId(res.userId);
        setStep('otp');
        setResendCooldown(30);
        showAlert('A 6-digit code has been sent to your email.', 'success');
      }
    } catch (err) {
      showAlert(err?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2: submit OTP ──
  const handleOtp = async (e) => {
    e.preventDefault();
    setAlert({ msg: '', type: '' });

    const code = otp.join('');
    if (code.length < 6) return showAlert('Please enter the full 6-digit code.');

    setLoading(true);
    try {
      const res = await verifyOtp({ userId, code });
      login(res.token, res.data);
      showAlert('Login successful! Redirecting...', 'success');
      setTimeout(() => navigate(redirectTo || ROUTES.HOME), 900);
    } catch (err) {
      showAlert(err?.message || 'Invalid or expired code. Please try again.');
      setOtp(['', '', '', '', '', '']);
      otpRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  // OTP box keyboard handling
  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const next = [...otp];
    next[index] = value.slice(-1);
    setOtp(next);
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(''));
      otpRefs.current[5]?.focus();
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setAlert({ msg: '', type: '' });
    setLoading(true);
    try {
      await loginUser({ email, password });
      setOtp(['', '', '', '', '', '']);
      setResendCooldown(30);
      showAlert('A new code has been sent to your email.', 'success');
    } catch (err) {
      showAlert('Failed to resend code. Please go back and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <AuthBrandPanel variant="login" />

      <div className="auth-form-side">
        <div className="auth-form-wrap">
          <Link to={ROUTES.HOME} className="auth-form-logo">
            <img src="/images/hafla-logo.png" alt="Hafla" className="auth-form-logo-img" />
          </Link>

          {/* ── Step 1: Credentials ── */}
          {step === 'credentials' && (
            <>
              <h1>Welcome back</h1>
              <p className="auth-sub">
                Don't have an account? <Link to={ROUTES.SIGNUP}>Create one free</Link>
              </p>

              {alert.msg && (
                <div className={`auth-alert ${alert.type} show`} role="alert">{alert.msg}</div>
              )}

              <form onSubmit={handleCredentials} noValidate>
                <div className="form-group">
                  <label className="form-label" htmlFor="email">Email address</label>
                  <input
                    className="form-input"
                    type="email"
                    id="email"
                    placeholder="you@example.com"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="password">
                    Password
                    <a href="#" className="forgot-link" style={{ float: 'right', fontWeight: 500, fontSize: 12, color: 'var(--accent)' }}>
                      Forgot password?
                    </a>
                  </label>
                  <PasswordInput
                    id="password"
                    name="password"
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>

                <button type="submit" className="auth-submit" disabled={loading}>
                  {loading ? <span className="btn-spinner" /> : 'Continue'}
                </button>
              </form>

              <div className="auth-divider">or continue with</div>
              <div className="social-btns">
                <button className="social-btn" onClick={() => showToast('Social login coming soon!')}>Google</button>
                <button className="social-btn" onClick={() => showToast('Social login coming soon!')}>Apple</button>
              </div>
            </>
          )}

          {/* ── Step 2: OTP ── */}
          {step === 'otp' && (
            <>
              <div style={{ marginBottom: 8 }}>
                <button
                  onClick={() => { setStep('credentials'); setAlert({ msg: '', type: '' }); setOtp(['','','','','','']); }}
                  style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 13, padding: 0, display: 'flex', alignItems: 'center', gap: 4, marginBottom: 16 }}
                >
                  ← Back
                </button>
              </div>

              <h1>Check your email</h1>
              <p className="auth-sub">
                We sent a 6-digit code to <strong>{email}</strong>
              </p>

              {alert.msg && (
                <div className={`auth-alert ${alert.type} show`} role="alert">{alert.msg}</div>
              )}

              <form onSubmit={handleOtp} noValidate>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'center', margin: '28px 0 32px' }} onPaste={handleOtpPaste}>
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      ref={(el) => (otpRefs.current[i] = el)}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(i, e)}
                      style={{
                        width: 48,
                        height: 56,
                        textAlign: 'center',
                        fontSize: 22,
                        fontWeight: 700,
                        borderRadius: 10,
                        border: `2px solid ${digit ? 'var(--accent)' : 'var(--border)'}`,
                        outline: 'none',
                        background: '#fff',
                        color: 'var(--primary)',
                        transition: 'border-color 0.15s',
                        fontFamily: 'inherit',
                      }}
                    />
                  ))}
                </div>

                <button type="submit" className="auth-submit" disabled={loading}>
                  {loading ? <span className="btn-spinner" /> : 'Verify & Sign In'}
                </button>
              </form>

              <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--muted)', marginTop: 20 }}>
                Didn't get the code?{' '}
                <button
                  onClick={handleResend}
                  disabled={resendCooldown > 0}
                  style={{ background: 'none', border: 'none', cursor: resendCooldown > 0 ? 'not-allowed' : 'pointer', color: resendCooldown > 0 ? 'var(--muted)' : 'var(--accent)', fontWeight: 600, fontSize: 13, padding: 0 }}
                >
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
                </button>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
