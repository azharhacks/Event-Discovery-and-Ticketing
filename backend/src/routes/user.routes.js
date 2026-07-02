const express = require('express');
const {
  getProfile,
  updateProfile,
  getAllUsers,
  updateUserStatus,
  removeUser,
} = require('../controllers/user.controller');
const { protect, adminOnly } = require('../middleware/auth.middleware');

const router = express.Router();

router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.get('/all', protect, adminOnly, getAllUsers);
router.patch('/:id/status', protect, adminOnly, updateUserStatus);
router.delete('/:id', protect, adminOnly, removeUser);

module.exports = router;
