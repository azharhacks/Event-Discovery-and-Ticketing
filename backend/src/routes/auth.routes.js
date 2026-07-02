const express = require('express');
const { register, login, verifyOtp } = require('../controllers/auth.controller');

const router = express.Router();

// POST /api/auth/register
router.post('/register', register);

// POST /api/auth/login  — step 1: validates credentials, sends OTP
router.post('/login', login);

// POST /api/auth/verify-otp  — step 2: validates OTP, returns JWT
router.post('/verify-otp', verifyOtp);

module.exports = router;
