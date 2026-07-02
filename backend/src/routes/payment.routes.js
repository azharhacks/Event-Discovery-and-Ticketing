const express = require('express');
const {
  getPaymentLedger,
  releaseEventPayout,
  refundOrder,
} = require('../controllers/payment.controller');
const { protect, adminOnly } = require('../middleware/auth.middleware');

const router = express.Router();

router.get('/admin/ledger', protect, adminOnly, getPaymentLedger);
router.post('/admin/payout', protect, adminOnly, releaseEventPayout);
router.post('/admin/refund', protect, adminOnly, refundOrder);

module.exports = router;
