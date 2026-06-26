const express = require('express');
const { createOrder, getMyTickets, getOrderStatus, getAllTransactions } = require('../controllers/order.controller');
const { protect, adminOnly } = require('../middleware/auth.middleware');

const router = express.Router();

// GET /api/orders/admin/all - Admin only - All transactions
router.get('/admin/all', protect, adminOnly, getAllTransactions);

// POST /api/orders - Protected (Attendee) - Create a pending order
router.post('/', protect, createOrder);

// GET /api/orders/my-tickets - Protected (Attendee) - Retrieve user's confirmed orders
router.get('/my-tickets', protect, getMyTickets);

// GET /api/orders/:id/status - Protected (Attendee/Organizer/Admin) - Poll order status
router.get('/:id/status', protect, getOrderStatus);

module.exports = router;
