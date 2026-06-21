export const formatKES = (price) =>
  Number(price) === 0 ? 'FREE' : `KES ${Number(price).toLocaleString()}`;

export const formatDate = (dateStr, opts = {}) => {
  const d = new Date(dateStr);
  return d.toLocaleString('en', { weekday: 'short', month: 'short', day: 'numeric', ...opts });
};

export const formatDateBadge = (dateStr) => {
  const d = new Date(dateStr);
  return {
    month: d.toLocaleString('en', { month: 'short' }).toUpperCase(),
    day: d.getDate(),
  };
};

export const formatPhone = (raw) => {
  const cleaned = raw.replace(/\s/g, '');
  if (cleaned.startsWith('0')) return '+254' + cleaned.slice(1);
  if (cleaned.startsWith('7') || cleaned.startsWith('1')) return '+254' + cleaned;
  return cleaned;
};

export const validateEmail = (email) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

export const validatePhone = (phone) =>
  /^[07]\d{8,9}$/.test(phone.replace(/\s/g, ''));

export const truncate = (str, n = 80) =>
  str && str.length > n ? str.slice(0, n) + '…' : str;
