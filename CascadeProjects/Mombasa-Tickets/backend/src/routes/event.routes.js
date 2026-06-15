const express = require('express');
const {
  getAllEvents,
  getEventById,
  createEvent,
  updateEventStatus,
} = require('../controllers/event.controller');
const { protect, adminOnly, organizerOnly } = require('../middleware/auth.middleware');

const router = express.Router();

// GET /api/events  – public
router.get('/', getAllEvents);

// GET /api/events/:id  – public
router.get('/:id', getEventById);

// POST /api/events  – protected, organizer only
router.post('/', protect, organizerOnly, createEvent);

// PATCH /api/events/:id/status  – protected, admin only
router.patch('/:id/status', protect, adminOnly, updateEventStatus);

module.exports = router;
