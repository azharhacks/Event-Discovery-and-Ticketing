const { PrismaClient } = require('@prisma/client');
const { initiateSTKPush } = require('../utils/mpesa');
const { splitPayment } = require('../utils/fees');
const { restoreTicketStock } = require('../utils/inventory');

const prisma = new PrismaClient();

const pay = async (req, res) => {
  try {
    const { orderId, phone } = req.body;

    if (!orderId || !phone) {
      return res.status(400).json({
        success: false,
        message: 'orderId and phone are required.',
      });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { attendee: true },
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    if (order.status === 'EXPIRED') {
      return res.status(400).json({ success: false, message: 'Order has expired. Please create a new order.' });
    }

    if (order.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: `Order is already ${order.status}. Cannot initiate payment.`,
      });
    }

    if (order.attendeeId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const amount = Math.ceil(Number(order.totalAmount));
    const stkResponse = await initiateSTKPush(phone, amount, orderId);

    const existingPayment = await prisma.payment.findUnique({ where: { orderId } });
    if (!existingPayment) {
      await prisma.payment.create({
        data: { orderId, amount: order.totalAmount, status: 'PENDING' },
      });
    }

    return res.status(200).json({
      success: true,
      message: 'STK Push sent. Please check your phone to complete payment.',
      data: {
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

const callback = async (req, res) => {
  try {
    const body = req.body;
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

    let mpesaReceiptNumber = null;
    let transactionDate = null;
    let orderId = null;

    if (ResultCode === 0 && CallbackMetadata?.Item) {
      for (const item of CallbackMetadata.Item) {
        if (item.Name === 'MpesaReceiptNumber') mpesaReceiptNumber = item.Value;
        if (item.Name === 'TransactionDate') transactionDate = item.Value?.toString();
        if (item.Name === 'AccountReference') orderId = item.Value;
      }
    }

    let payment = null;

    if (orderId) {
      payment = await prisma.payment.findUnique({ where: { orderId } });
    }

    if (!payment) {
      const existingCallback = await prisma.paymentCallback.findFirst({
        where: { checkoutRequestId: CheckoutRequestID },
        include: { payment: true },
      });
      payment = existingCallback?.payment || null;
    }

    if (!payment) {
      console.error('[callback] No matching payment for CheckoutRequestID:', CheckoutRequestID);
      return res.status(200).json({ ResultCode: 0, ResultDesc: 'Accepted' });
    }

    const isSuccess = ResultCode === 0;
    const newPaymentStatus = isSuccess ? 'SUCCESS' : 'FAILED';
    const newOrderStatus = isSuccess ? 'CONFIRMED' : 'FAILED';

    const order = await prisma.order.findUnique({
      where: { id: payment.orderId },
      include: { ticket: { include: { event: true } } },
    });

    if (!order) {
      return res.status(200).json({ ResultCode: 0, ResultDesc: 'Accepted' });
    }

    const { platformFee, organizerShare } = splitPayment(order.totalAmount);

    await prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: newPaymentStatus,
          mpesaReceiptNumber: mpesaReceiptNumber || null,
          transactionDate: transactionDate ? new Date(transactionDate) : new Date(),
          ...(isSuccess ? { platformFee, organizerShare, escrowStatus: 'HELD' } : {}),
        },
      });

      await tx.order.update({
        where: { id: payment.orderId },
        data: { status: newOrderStatus },
      });

      if (!isSuccess) {
        await restoreTicketStock(tx, order.ticketId, order.quantity);
      }

      if (isSuccess) {
        const existingQR = await tx.qRCode.findUnique({ where: { qrToken: payment.orderId } });
        if (!existingQR) {
          await tx.qRCode.create({
            data: {
              ticketId: order.ticketId,
              qrToken: payment.orderId,
              isScanned: false,
            },
          });
          console.log(`[callback] Generated QRCode for order ${payment.orderId}`);
        }
      }
    });

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

    return res.status(200).json({ ResultCode: 0, ResultDesc: 'Accepted' });
  } catch (error) {
    console.error('[callback]', error);
    return res.status(200).json({ ResultCode: 0, ResultDesc: 'Accepted' });
  }
};

module.exports = { pay, callback };
