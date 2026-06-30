const express = require('express');
const {
  getAllEvents,
  getEventById,
  createEvent,
  updateEvent,
  updateEventStatus,
  getPendingEvents,
  getOrganizerEvents,
  getAdminAllEvents,
  getEventAttendees,
  getOrganizerSalesReport,
} = require('../controllers/event.controller');
const { protect, adminOnly, organizerOnly } = require('../middleware/auth.middleware');

const router = express.Router();

// GET /api/events  – public
router.get('/', getAllEvents);

// GET /api/events/admin/pending – protected, admin only
router.get('/admin/pending', protect, adminOnly, getPendingEvents);

// GET /api/events/admin/all – protected, admin only
router.get('/admin/all', protect, adminOnly, getAdminAllEvents);

// GET /api/events/admin/report – protected, admin only – organizer sales report
router.get('/admin/report', protect, adminOnly, getOrganizerSalesReport);

// GET /api/events/organizer/my-events – protected, organizer only
router.get('/organizer/my-events', protect, organizerOnly, getOrganizerEvents);

// GET /api/events/:id  – public
router.get('/:id', getEventById);

// GET /api/events/:id/attendees – protected, organizer or admin
router.get('/:id/attendees', protect, getEventAttendees);

// POST /api/events  – protected, organizer only
router.post('/', protect, organizerOnly, createEvent);

// PUT /api/events/:id  – protected, organizer only (own event)
router.put('/:id', protect, organizerOnly, updateEvent);

// PATCH /api/events/:id/status  – protected, admin only
router.patch('/:id/status', protect, adminOnly, updateEventStatus);

module.exports = router;
