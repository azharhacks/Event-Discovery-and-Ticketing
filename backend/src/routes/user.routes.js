const express = require('express');
const { getProfile, updateProfile, getAllUsers } = require('../controllers/user.controller');
const { protect, adminOnly } = require('../middleware/auth.middleware');

const router = express.Router();

// GET /api/users/profile - Protected
router.get('/profile', protect, getProfile);

// PUT /api/users/profile - Protected
router.put('/profile', protect, updateProfile);

// GET /api/users/all - Admin only
router.get('/all', protect, adminOnly, getAllUsers);

module.exports = router;
