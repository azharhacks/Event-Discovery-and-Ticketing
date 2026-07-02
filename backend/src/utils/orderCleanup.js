const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const ORDER_TIMEOUT_MS = (Number(process.env.ORDER_TIMEOUT_MINUTES) || 15) * 60 * 1000;

const cancelExpiredOrders = async () => {
  const cutoff = new Date(Date.now() - ORDER_TIMEOUT_MS);

  const expired = await prisma.order.findMany({
    where: {
      status: 'PENDING',
      createdAt: { lt: cutoff },
    },
    include: { ticket: true },
  });

  if (expired.length === 0) return 0;

  for (const order of expired) {
    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: order.id },
        data: { status: 'EXPIRED' },
      });
      await tx.ticket.update({
        where: { id: order.ticketId },
        data: { quantityAvailable: { increment: order.quantity } },
      });
      const payment = await tx.payment.findUnique({ where: { orderId: order.id } });
      if (payment && payment.status === 'PENDING') {
        await tx.payment.update({
          where: { id: payment.id },
          data: { status: 'FAILED' },
        });
      }
    });
  }

  console.log(`[orderCleanup] Expired ${expired.length} stale pending order(s).`);
  return expired.length;
};

const startOrderCleanupJob = () => {
  cancelExpiredOrders().catch((err) => console.error('[orderCleanup]', err));
  const interval = setInterval(() => {
    cancelExpiredOrders().catch((err) => console.error('[orderCleanup]', err));
  }, 5 * 60 * 1000);
  return interval;
};

module.exports = { cancelExpiredOrders, startOrderCleanupJob };
