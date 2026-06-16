/**
 * auth.js — Login & Signup logic for Mombasa Tickets
 */

import { loginUser, registerUser, setAuth, isLoggedIn } from './api.js';

// ─── Redirect if already logged in ───────────────────────────────────────────
if (isLoggedIn()) {
  window.location.href = 'index.html';
}

// ─── Utilities ────────────────────────────────────────────────────────────────
const $ = (id) => document.getElementById(id);

function showAlert(el, message, type = 'error') {
  el.textContent = message;
  el.className = `auth-alert ${type} show`;
}

function hideAlert(el) {
  el.className = 'auth-alert';
  el.textContent = '';
}

function setLoading(btn, spinner, text, loading) {
  btn.disabled = loading;
  spinner.style.display = loading ? 'inline-block' : 'none';
  text.style.opacity = loading ? '0' : '1';
}

function showToast(message) {
  const t = $('toast');
  if (!t) return;
  t.textContent = message;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3000);
}

// ─── Password toggle ──────────────────────────────────────────────────────────
function setupPasswordToggle(toggleId, inputId) {
  const toggle = $(toggleId);
  const input  = $(inputId);
  if (!toggle || !input) return;

  const eyeOpen = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>`;
  const eyeOff = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>`;

  toggle.addEventListener('click', () => {
    const isText = input.type === 'text';
    input.type = isText ? 'password' : 'text';
    toggle.innerHTML = isText ? eyeOpen : eyeOff;
    toggle.setAttribute('aria-label', isText ? 'Show password' : 'Hide password');
  });
}

// ─── Password strength ────────────────────────────────────────────────────────
function checkStrength(pw) {
  let score = 0;
  if (pw.length >= 8)  score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return score;
}

const strengthMeta = [
  { label: 'Too short', color: '#EF4444', width: '15%' },
  { label: 'Weak',      color: '#F97316', width: '30%' },
  { label: 'Fair',      color: '#FBBF24', width: '55%' },
  { label: 'Good',      color: '#34D399', width: '75%' },
  { label: 'Strong',    color: '#10B981', width: '90%' },
  { label: 'Very strong', color: '#059669', width: '100%' },
];

// ─── Form validation helpers ──────────────────────────────────────────────────
function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function validatePhone(phone) {
  // Accept formats: 07XXXXXXXX, 7XXXXXXXX (we prepend +254)
  return /^[07]\d{8,9}$/.test(phone.replace(/\s/g, ''));
}

function formatPhone(raw) {
  const cleaned = raw.replace(/\s/g, '');
  if (cleaned.startsWith('0')) return '+254' + cleaned.slice(1);
  if (cleaned.startsWith('7') || cleaned.startsWith('1')) return '+254' + cleaned;
  return cleaned; // already formatted or empty
}

// ═══════════════════════════════════════════════════════════════════════════════
//  LOGIN PAGE
// ═══════════════════════════════════════════════════════════════════════════════
const loginForm = $('login-form');
if (loginForm) {
  setupPasswordToggle('toggle-login-pw', 'login-password');

  const alert   = $('login-alert');
  const btn     = $('login-btn');
  const spinner = $('login-spinner');
  const btnText = $('login-btn-text');

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideAlert(alert);

    const email    = $('login-email').value.trim();
    const password = $('login-password').value;

    // Client-side validation
    if (!email) {
      showAlert(alert, 'Please enter your email address.');
      $('login-email').focus();
      return;
    }
    if (!validateEmail(email)) {
      showAlert(alert, 'Please enter a valid email address.');
      $('login-email').classList.add('error');
      $('login-email').focus();
      return;
    }
    if (!password) {
      showAlert(alert, 'Please enter your password.');
      $('login-password').focus();
      return;
    }

    setLoading(btn, spinner, btnText, true);

    try {
      const res = await loginUser({ email, password });

      // Store auth data
      setAuth(res.token, res.data);

      showAlert(alert, '✓ Login successful! Redirecting…', 'success');

      setTimeout(() => {
        // Redirect based on role
        if (res.data.role === 'ORGANIZER') {
          window.location.href = 'index.html'; // TODO: organizer dashboard
        } else {
          window.location.href = 'index.html';
        }
      }, 900);

    } catch (err) {
      const msg = err?.message || 'Login failed. Please try again.';
      showAlert(alert, msg);
      setLoading(btn, spinner, btnText, false);
    }
  });

  // Clear error styling on input
  [$('login-email'), $('login-password')].forEach((input) => {
    if (input) input.addEventListener('input', () => input.classList.remove('error'));
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
//  SIGNUP PAGE
// ═══════════════════════════════════════════════════════════════════════════════
const signupForm = $('signup-form');
if (signupForm) {
  setupPasswordToggle('toggle-signup-pw',  'signup-password');
  setupPasswordToggle('toggle-confirm-pw', 'signup-confirm');

  const alert   = $('signup-alert');
  const btn     = $('signup-btn');
  const spinner = $('signup-spinner');
  const btnText = $('signup-btn-text');

  // ── Role picker interaction ──
  const roleOptions = document.querySelectorAll('.role-option');
  roleOptions.forEach((opt) => {
    opt.addEventListener('click', () => {
      roleOptions.forEach((o) => o.classList.remove('selected'));
      opt.classList.add('selected');
      opt.querySelector('input[type="radio"]').checked = true;
    });
  });

  // ── Password strength meter ──
  const pwInput    = $('signup-password');
  const strengthEl = $('pw-strength');
  const fillEl     = $('pw-strength-fill');
  const labelEl    = $('pw-strength-label');

  if (pwInput) {
    pwInput.addEventListener('input', () => {
      const val = pwInput.value;
      if (!val) { strengthEl.style.display = 'none'; return; }
      strengthEl.style.display = 'flex';
      const score = Math.min(checkStrength(val), strengthMeta.length - 1);
      const meta  = strengthMeta[score];
      fillEl.style.width      = meta.width;
      fillEl.style.background = meta.color;
      labelEl.textContent     = meta.label;
      labelEl.style.color     = meta.color;
    });
  }

  // ── Form submit ──
  signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideAlert(alert);

    const fullName       = $('signup-name').value.trim();
    const email          = $('signup-email').value.trim();
    const phoneRaw       = $('signup-phone').value.trim();
    const password       = $('signup-password').value;
    const confirmPw      = $('signup-confirm').value;
    const role           = document.querySelector('input[name="role"]:checked')?.value || 'ATTENDEE';
    const termsChecked   = $('agree-terms').checked;

    // ── Validation ──
    if (!fullName) {
      showAlert(alert, 'Please enter your full name.');
      $('signup-name').focus(); return;
    }
    if (fullName.length < 2) {
      showAlert(alert, 'Name must be at least 2 characters.');
      $('signup-name').focus(); return;
    }
    if (!email) {
      showAlert(alert, 'Please enter your email address.');
      $('signup-email').focus(); return;
    }
    if (!validateEmail(email)) {
      showAlert(alert, 'Please enter a valid email address.');
      $('signup-email').classList.add('error'); $('signup-email').focus(); return;
    }
    if (phoneRaw && !validatePhone(phoneRaw)) {
      showAlert(alert, 'Please enter a valid Kenyan phone number (e.g. 0712 345678).');
      $('signup-phone').classList.add('error'); $('signup-phone').focus(); return;
    }
    if (!password) {
      showAlert(alert, 'Please create a password.');
      $('signup-password').focus(); return;
    }
    if (password.length < 8) {
      showAlert(alert, 'Password must be at least 8 characters long.');
      $('signup-password').classList.add('error'); $('signup-password').focus(); return;
    }
    if (password !== confirmPw) {
      showAlert(alert, 'Passwords do not match. Please check and try again.');
      $('signup-confirm').classList.add('error'); $('signup-confirm').focus(); return;
    }
    if (!termsChecked) {
      showAlert(alert, 'Please agree to our Terms of Service and Privacy Policy to continue.');
      return;
    }

    setLoading(btn, spinner, btnText, true);

    try {
      const phone = phoneRaw ? formatPhone(phoneRaw) : undefined;
      await registerUser({ fullName, email, password, phone, role });

      showAlert(alert, '✓ Account created! Redirecting to login…', 'success');
      setTimeout(() => { window.location.href = 'login.html?registered=1'; }, 1200);

    } catch (err) {
      const msg = err?.message || 'Registration failed. Please try again.';
      showAlert(alert, msg);
      setLoading(btn, spinner, btnText, false);
    }
  });

  // Clear errors on typing
  signupForm.querySelectorAll('.form-input').forEach((input) => {
    input.addEventListener('input', () => input.classList.remove('error'));
  });
}

// ─── Show "registered" success on login page ──────────────────────────────────
if (loginForm) {
  const params = new URLSearchParams(window.location.search);
  if (params.get('registered') === '1') {
    const alert = $('login-alert');
    showAlert(alert, '✓ Account created! Please sign in to continue.', 'success');
  }
}
