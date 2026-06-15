const { PrismaClient } = require('@prisma/client');
const { initiateSTKPush } = require('../utils/mpesa');

const prisma = new PrismaClient();


//initiate mpesa stk push payment controller
const pay = async (req, res) => {
  try {
    const { orderId, phone } = req.body;

    if (!orderId || !phone) {
      return res.status(400).json({
        success: false,
        message: 'orderId and phone are required.',
      });
    }

    // Fetch the order to get the amount
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { attendee: true },
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    if (order.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: `Order is already ${order.status}. Cannot initiate payment.`,
      });
    }

    // Verify the requesting user owns this order
    if (order.attendeeId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const amount = Math.ceil(Number(order.totalAmount)); // M-Pesa requires whole numbers

    // Initiate STK Push via Safaricom Daraja API
    const stkResponse = await initiateSTKPush(phone, amount, orderId);

    // Create a pending payment record
    const payment = await prisma.payment.create({
      data: {
        orderId,
        amount: order.totalAmount,
        status: 'PENDING',
      },
    });

    return res.status(200).json({
      success: true,
      message: 'STK Push sent. Please check your phone to complete payment.',
      data: {
        paymentId: payment.id,
        checkoutRequestId: stkResponse.CheckoutRequestID,
        merchantRequestId: stkResponse.MerchantRequestID,
      },
    });
  } catch (error) {
    console.error('[pay]', error?.response?.data || error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to initiate payment. Please try again.',
    });
  }
};

//handle Safaricom Daraja callback
const callback = async (req, res) => {
  try {
    const body = req.body;

    // Safaricom wraps the result inside Body.stkCallback
    const stkCallback = body?.Body?.stkCallback;

    if (!stkCallback) {
      console.error('[callback] Malformed callback payload:', body);
      return res.status(400).json({ success: false, message: 'Invalid callback payload.' });
    }

    const {
      MerchantRequestID,
      CheckoutRequestID,
      ResultCode,
      ResultDesc,
      CallbackMetadata,
    } = stkCallback;

    // Find the payment by checkoutRequestId stored in PaymentCallback
    // We'll look for pending payment linked to the relevant order.
    // Since we stored orderId as AccountReference, we need to find via CallbackMetadata.
    let mpesaReceiptNumber = null;
    let transactionDate = null;
    let amount = null;
    let orderId = null;

    if (ResultCode === 0 && CallbackMetadata?.Item) {
      // Payment successful — extract metadata
      for (const item of CallbackMetadata.Item) {
        if (item.Name === 'MpesaReceiptNumber') mpesaReceiptNumber = item.Value;
        if (item.Name === 'TransactionDate') transactionDate = item.Value?.toString();
        if (item.Name === 'Amount') amount = item.Value;
        if (item.Name === 'AccountReference') orderId = item.Value;
      }
    }

    // Find the pending payment record (match by orderId or CheckoutRequestID stored in callback)
    // Prefer orderId from metadata; fall back to finding via PaymentCallback
    let payment = null;

    if (orderId) {
      payment = await prisma.payment.findUnique({ where: { orderId } });
    }

    if (!payment) {
      // Try to find via existing callback record
      const existingCallback = await prisma.paymentCallback.findFirst({
        where: { checkoutRequestId: CheckoutRequestID },
        include: { payment: true },
      });
      payment = existingCallback?.payment || null;
    }

    if (!payment) {
      console.error('[callback] No matching payment for CheckoutRequestID:', CheckoutRequestID);
      // Acknowledge to Safaricom even if we can't find the payment
      return res.status(200).json({ ResultCode: 0, ResultDesc: 'Accepted' });
    }

    const newPaymentStatus = ResultCode === 0 ? 'SUCCESS' : 'FAILED';
    const newOrderStatus = ResultCode === 0 ? 'CONFIRMED' : 'FAILED';

    // Update payment record
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: newPaymentStatus,
        mpesaReceiptNumber: mpesaReceiptNumber || null,
        transactionDate: transactionDate ? new Date(transactionDate) : new Date(),
      },
    });

    // Update the related order status
    await prisma.order.update({
      where: { id: payment.orderId },
      data: { status: newOrderStatus },
    });

    // Store the raw callback data in PaymentCallback
    await prisma.paymentCallback.upsert({
      where: { paymentId: payment.id },
      update: {
        merchantRequestId: MerchantRequestID,
        checkoutRequestId: CheckoutRequestID,
        resultCode: ResultCode,
        resultDescription: ResultDesc,
        callbackTimestamp: new Date(),
      },
      create: {
        paymentId: payment.id,
        merchantRequestId: MerchantRequestID,
        checkoutRequestId: CheckoutRequestID,
        resultCode: ResultCode,
        resultDescription: ResultDesc,
      },
    });

    console.log(`[callback] Payment ${payment.id} → ${newPaymentStatus}`);

    // Safaricom expects a 200 acknowledgement
    return res.status(200).json({ ResultCode: 0, ResultDesc: 'Accepted' });
  } catch (error) {
    console.error('[callback]', error);
    return res.status(200).json({ ResultCode: 0, ResultDesc: 'Accepted' });
  }
};

module.exports = { pay, callback };
