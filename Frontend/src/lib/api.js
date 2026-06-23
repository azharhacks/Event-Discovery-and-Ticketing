import { getToken } from './auth';

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

export const createEvent = (body) => request('/events', { method: 'POST', body: JSON.stringify(body) });
export const getOrganizerEvents = () => request('/events/organizer/my-events');
export const getPendingEvents = () => request('/events/admin/pending');
export const getAdminEvents  = () => request('/events/admin/all');
export const getAllUsers      = () => request('/users/all');
export const updateEventStatus = (id, status) => request(`/events/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });

// Categories
export const getCategories = () => request('/categories');

// Orders
export const createOrder = (body) => request('/orders', { method: 'POST', body: JSON.stringify(body) });
export const getMyTickets = () => request('/orders/my-tickets');
export const getOrderStatus = (id) => request(`/orders/${id}/status`);

// Payments
export const initiateMpesaPay = (body) => request('/mpesa/pay', { method: 'POST', body: JSON.stringify(body) });

// QR Verification
export const verifyTicket = (qrToken) => request('/tickets/verify', { method: 'POST', body: JSON.stringify({ qrToken }) });

// Profile
export const getUserProfile = () => request('/users/profile');
export const updateUserProfile = (body) => request('/users/profile', { method: 'PUT', body: JSON.stringify(body) });
