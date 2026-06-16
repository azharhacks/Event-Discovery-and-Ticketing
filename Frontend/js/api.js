
const BASE_URL = 'http://localhost:5000/api';

// ── token helpers ──
export const getToken = () => localStorage.getItem('mt_token');
export const getUser  = () => JSON.parse(localStorage.getItem('mt_user') || 'null');
export const setAuth  = (token, user) => {
  localStorage.setItem('mt_token', token);
  localStorage.setItem('mt_user', JSON.stringify(user));
};
export const clearAuth = () => {
  localStorage.removeItem('mt_token');
  localStorage.removeItem('mt_user');
};
export const isLoggedIn = () => !!getToken();

// ── base fetch ──
async function request(path, options = {}) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) throw { status: res.status, message: data.message || 'Request failed' };
  return data;
}

// ── Auth ──
export const registerUser = (body) =>
  request('/auth/register', { method: 'POST', body: JSON.stringify(body) });

export const loginUser = (body) =>
  request('/auth/login', { method: 'POST', body: JSON.stringify(body) });

// ── Events ──
export const getEvents = (params = {}) => {
  const qs = new URLSearchParams(
    Object.fromEntries(Object.entries(params).filter(([, v]) => v !== '' && v != null))
  ).toString();
  return request(`/events${qs ? '?' + qs : ''}`);
};

export const getEvent = (id) => request(`/events/${id}`);
