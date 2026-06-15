const express = require('express');
const { pay, callback } = require('../controllers/mpesa.controller');
const { protect } = require('../middleware/auth.middleware');

const router = express.Router();

// POST /api/mpesa/pay  – protected (authenticated users only)
router.post('/pay', protect, pay);

// POST /api/mpesa/callback  – public (called by Safaricom Daraja servers)
router.post('/callback', callback);

module.exports = router;
