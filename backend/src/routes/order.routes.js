const express = require('express');
const {
  createOrder,
  getMyTickets,
  getOrderStatus,
  getOrderQr,
  getCheckoutOptions,
  confirmFreeOrder,
  demoPayOrder,
  getAllTransactions,
} = require('../controllers/order.controller');
const { protect, adminOnly } = require('../middleware/auth.middleware');

const router = express.Router();

// GET /api/orders/admin/all - Admin only - All transactions
router.get('/admin/all', protect, adminOnly, getAllTransactions);

// GET /api/orders/checkout-options - Payment options for checkout UI
router.get('/checkout-options', protect, getCheckoutOptions);

// POST /api/orders - Create a pending order
router.post('/', protect, createOrder);

// GET /api/orders/my-tickets - Confirmed tickets for current user
router.get('/my-tickets', protect, getMyTickets);

// POST /api/orders/:id/confirm-free - Confirm a free (KES 0) order
router.post('/:id/confirm-free', protect, confirmFreeOrder);

// POST /api/orders/:id/demo-pay - Simulate payment (demo / no M-Pesa keys)
router.post('/:id/demo-pay', protect, demoPayOrder);

// GET /api/orders/:id/qr - Protected (Attendee) - Signed QR payload
router.get('/:id/qr', protect, getOrderQr);

// GET /api/orders/:id/status - Protected (Attendee/Organizer/Admin) - Poll order status
router.get('/:id/status', protect, getOrderStatus);

module.exports = router;
