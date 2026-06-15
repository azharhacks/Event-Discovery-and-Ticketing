const axios = require('axios');

// ─────────────────────────────────────────────
// getAccessToken
// Fetches an OAuth bearer token from Safaricom sandbox
// ─────────────────────────────────────────────
const getAccessToken = async () => {
  const consumerKey = process.env.MPESA_CONSUMER_KEY;
  const consumerSecret = process.env.MPESA_CONSUMER_SECRET;

  if (!consumerKey || !consumerSecret) {
    throw new Error('M-Pesa consumer key and secret are not configured in .env');
  }

  const credentials = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');

  const response = await axios.get(
    'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
    {
      headers: {
        Authorization: `Basic ${credentials}`,
      },
    }
  );

  return response.data.access_token;
};

// ─────────────────────────────────────────────
// initiateSTKPush
// Sends an STK Push request to the customer's phone
//
// @param {string} phone        – Customer phone e.g. 254712345678
// @param {number} amount       – Amount in KES (integer)
// @param {string} orderId      – Used as AccountReference
// ─────────────────────────────────────────────
const initiateSTKPush = async (phone, amount, orderId) => {
  const accessToken = await getAccessToken();

  const shortcode = process.env.MPESA_SHORTCODE;
  const passkey = process.env.MPESA_PASSKEY;
  const callbackUrl = `${process.env.BASE_URL}/api/mpesa/callback`;

  // Generate the timestamp in format YYYYMMDDHHmmss
  const now = new Date();
  const timestamp = now
    .toISOString()
    .replace(/[-T:.Z]/g, '')
    .slice(0, 14);

  // Generate the password (Base64 of shortcode + passkey + timestamp)
  const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64');

  // Sanitise phone number – ensure it starts with 254
  let sanitisedPhone = phone.toString().replace(/\s/g, '');
  if (sanitisedPhone.startsWith('0')) {
    sanitisedPhone = `254${sanitisedPhone.slice(1)}`;
  }
  if (sanitisedPhone.startsWith('+')) {
    sanitisedPhone = sanitisedPhone.slice(1);
  }

  const payload = {
    BusinessShortCode: shortcode,
    Password: password,
    Timestamp: timestamp,
    TransactionType: 'CustomerPayBillOnline',
    Amount: amount,
    PartyA: sanitisedPhone,
    PartyB: shortcode,
    PhoneNumber: sanitisedPhone,
    CallBackURL: callbackUrl,
    AccountReference: orderId,
    TransactionDesc: `Mombasa Tickets – Order ${orderId}`,
  };

  const response = await axios.post(
    'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
    payload,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    }
  );

  return response.data;
};

module.exports = { getAccessToken, initiateSTKPush };
