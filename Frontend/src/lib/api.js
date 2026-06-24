import { getToken } from './auth';
//talks to the backend

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

async function request(path, options = {}) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res  = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) throw { status: res.status, message: data.message || 'Request failed' };
  return data;
}

export const loginUser    = (body) => request('/auth/login',    { method: 'POST', body: JSON.stringify(body) });
export const registerUser = (body) => request('/auth/register', { method: 'POST', body: JSON.stringify(body) });

export const getEvents = (params = {}) => {
  const qs = new URLSearchParams(
    Object.fromEntries(Object.entries(params).filter(([, v]) => v !== '' && v != null))
  ).toString();
  return request(`/events${qs ? '?' + qs : ''}`);
};

export const getEvent = (id) => request(`/events/${id}`);
