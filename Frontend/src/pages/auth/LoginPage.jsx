import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import AuthBrandPanel from '../../components/auth/AuthBrandPanel';
import PasswordInput from '../../components/auth/PasswordInput';
import { loginUser } from '../../lib/api';
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

  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [alert, setAlert]       = useState({ msg: '', type: '' });
  const [loading, setLoading]   = useState(false);

  if (isLoggedIn) {
    navigate(redirectTo || ROUTES.HOME, { replace: true });
    return null;
  }

  const showAlert = (msg, type = 'error') => setAlert({ msg, type });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAlert({ msg: '', type: '' });

    if (!email)              return showAlert('Please enter your email address.');
    if (!validateEmail(email)) return showAlert('Please enter a valid email address.');
    if (!password)           return showAlert('Please enter your password.');

    setLoading(true);
    try {
      const res = await loginUser({ email, password });
      login(res.token, res.data);
      showAlert('Login successful! Redirecting...', 'success');
      setTimeout(() => navigate(redirectTo || ROUTES.HOME), 900);
    } catch (err) {
      showAlert(err?.message || 'Login failed. Please try again.');
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

          <h1>Welcome back</h1>
          <p className="auth-sub">
            Don't have an account? <Link to={ROUTES.SIGNUP}>Create one free</Link>
          </p>

          {alert.msg && (
            <div className={`auth-alert ${alert.type} show`} role="alert">{alert.msg}</div>
          )}

          <form onSubmit={handleSubmit} noValidate>
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
              {loading ? <span className="btn-spinner" /> : 'Sign In'}
            </button>
          </form>

          <div className="auth-divider">or continue with</div>
          <div className="social-btns">
            <button className="social-btn" onClick={() => showToast('Social login coming soon!')}>
              Google
            </button>
            <button className="social-btn" onClick={() => showToast('Social login coming soon!')}>
              Apple
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
