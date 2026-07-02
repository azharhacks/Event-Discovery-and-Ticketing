const crypto = require('crypto');

const getSecret = () => process.env.QR_SECRET || process.env.JWT_SECRET || 'hafla-qr-secret';

const signPayload = (orderId, eventId, quantity) => {
  const base = `${orderId}:${eventId}:${quantity}`;
  return crypto.createHmac('sha256', getSecret()).update(base).digest('hex').slice(0, 16);
};

const buildQrPayload = (orderId, eventId, quantity) => {
  const payload = { orderId, eventId, quantity: Number(quantity), sig: signPayload(orderId, eventId, quantity) };
  return Buffer.from(JSON.stringify(payload)).toString('base64url');
};

const parseQrPayload = (raw) => {
  if (!raw || typeof raw !== 'string') return null;

  const trimmed = raw.trim();

  // Signed payload (base64url JSON)
  try {
    const decoded = JSON.parse(Buffer.from(trimmed, 'base64url').toString('utf8'));
    if (decoded?.orderId && decoded?.eventId && decoded?.sig) {
      const expected = signPayload(decoded.orderId, decoded.eventId, decoded.quantity);
      if (decoded.sig !== expected) return { error: 'Invalid QR signature.' };
      return { orderId: decoded.orderId, eventId: decoded.eventId, quantity: decoded.quantity };
    }
  } catch {
    // fall through — legacy raw order ID
  }

  // Legacy: raw order ID string
  if (/^c[a-z0-9]{20,}$/i.test(trimmed)) {
    return { orderId: trimmed, legacy: true };
  }

  return null;
};

module.exports = { buildQrPayload, parseQrPayload };
