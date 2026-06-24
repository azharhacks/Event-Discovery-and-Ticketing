const express = require('express');
const { createOrder, getMyTickets, getOrderStatus } = require('../controllers/order.controller');
const { protect } = require('../middleware/auth.middleware');

const router = express.Router();

// POST /api/orders - Protected (Attendee) - Create a pending order
router.post('/', protect, createOrder);

// GET /api/orders/my-tickets - Protected (Attendee) - Retrieve user's confirmed orders
router.get('/my-tickets', protect, getMyTickets);

// GET /api/orders/:id/status - Protected (Attendee/Organizer/Admin) - Poll order status
router.get('/:id/status', protect, getOrderStatus);

module.exports = router;
