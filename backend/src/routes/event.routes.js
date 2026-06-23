const express = require('express');
const {
  getAllEvents,
  getEventById,
  createEvent,
  updateEventStatus,
  getPendingEvents,
  getOrganizerEvents,
  getAdminAllEvents,
} = require('../controllers/event.controller');
const { protect, adminOnly, organizerOnly } = require('../middleware/auth.middleware');

const router = express.Router();

// GET /api/events  – public
router.get('/', getAllEvents);

// GET /api/events/admin/pending – protected, admin only
router.get('/admin/pending', protect, adminOnly, getPendingEvents);

// GET /api/events/admin/all – protected, admin only
router.get('/admin/all', protect, adminOnly, getAdminAllEvents);

// GET /api/events/organizer/my-events – protected, organizer only
router.get('/organizer/my-events', protect, organizerOnly, getOrganizerEvents);

// GET /api/events/:id  – public
router.get('/:id', getEventById);

// POST /api/events  – protected, organizer only
router.post('/', protect, organizerOnly, createEvent);

// PATCH /api/events/:id/status  – protected, admin only
router.patch('/:id/status', protect, adminOnly, updateEventStatus);

module.exports = router;
