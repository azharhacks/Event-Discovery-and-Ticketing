const { PrismaClient } = require('@prisma/client');
const { splitPayment } = require('./fees');

const prisma = new PrismaClient();

const isDemoPaymentsEnabled = () => {
  if (process.env.DEMO_PAYMENTS === 'true') return true;
  const key = process.env.MPESA_CONSUMER_KEY || '';
  return !key || key === 'your_mpesa_consumer_key';
};

const finalizeOrder = async (orderId, { receiptNumber = null, simulated = false } = {}) => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { ticket: true, payment: true },
  });

  if (!order) {
    const err = new Error('Order not found.');
    err.status = 404;
    throw err;
  }

  if (order.status === 'CONFIRMED') {
    return order;
  }

  if (!['PENDING'].includes(order.status)) {
    const err = new Error(`Order is ${order.status} and cannot be confirmed.`);
    err.status = 400;
    throw err;
  }

  const { platformFee, organizerShare } = splitPayment(order.totalAmount);
  const receipt = receiptNumber || (simulated ? `DEMO${Date.now()}` : null);

  await prisma.$transaction(async (tx) => {
    const paymentData = {
      status: 'SUCCESS',
      amount: order.totalAmount,
      platformFee,
      organizerShare,
      escrowStatus: 'HELD',
      transactionDate: new Date(),
      mpesaReceiptNumber: receipt,
    };

    if (order.payment) {
      await tx.payment.update({ where: { id: order.payment.id }, data: paymentData });
    } else {
      await tx.payment.create({
        data: { orderId: order.id, ...paymentData },
      });
    }

    await tx.order.update({
      where: { id: orderId },
      data: { status: 'CONFIRMED' },
    });

    const existingQR = await tx.qRCode.findUnique({ where: { qrToken: orderId } });
    if (!existingQR) {
      await tx.qRCode.create({
        data: {
          ticketId: order.ticketId,
          qrToken: orderId,
          isScanned: false,
        },
      });
    }
  });

  return prisma.order.findUnique({
    where: { id: orderId },
    include: {
      ticket: { include: { event: true } },
      payment: true,
    },
  });
};

module.exports = { finalizeOrder, isDemoPaymentsEnabled };
