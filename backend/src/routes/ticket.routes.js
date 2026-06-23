const express = require('express');
const { verifyTicket } = require('../controllers/ticket.controller');
const { protect, organizerOnly } = require('../middleware/auth.middleware');

const router = express.Router();

// POST /api/tickets/verify - Protected (Organizer/Admin)
router.post('/verify', protect, organizerOnly, verifyTicket);

module.exports = router;
