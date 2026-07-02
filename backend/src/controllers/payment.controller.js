const { PrismaClient } = require('@prisma/client');
const { restoreTicketStock } = require('../utils/inventory');

const prisma = new PrismaClient();

const getPaymentLedger = async (req, res) => {
  try {
    const payments = await prisma.payment.findMany({
      where: { status: 'SUCCESS' },
      include: {
        order: {
          include: {
            attendee: { select: { id: true, fullName: true, email: true } },
            ticket: {
              include: {
                event: {
                  select: {
                    id: true,
                    title: true,
                    organiserId: true,
                    organiser: { select: { id: true, fullName: true, email: true, phone: true } },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { transactionDate: 'desc' },
    });

    const held = payments.filter((p) => p.escrowStatus === 'HELD');
    const released = payments.filter((p) => p.escrowStatus === 'RELEASED');
    const refunded = payments.filter((p) => p.escrowStatus === 'REFUNDED');

    const summary = {
      totalHeld: held.reduce((s, p) => s + Number(p.amount), 0),
      totalReleased: released.reduce((s, p) => s + Number(p.organizerShare), 0),
      totalRefunded: refunded.reduce((s, p) => s + Number(p.amount), 0),
      platformFees: payments.reduce((s, p) => s + Number(p.platformFee), 0),
      heldCount: held.length,
      releasedCount: released.length,
      refundedCount: refunded.length,
    };

    const payouts = await prisma.payout.findMany({
      include: {
        organizer: { select: { id: true, fullName: true, email: true } },
        event: { select: { id: true, title: true } },
        initiatedBy: { select: { id: true, fullName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json({
      success: true,
      data: { payments, payouts, summary },
    });
  } catch (error) {
    console.error('[getPaymentLedger]', error);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

const releaseEventPayout = async (req, res) => {
  try {
    const { eventId, notes } = req.body;
    const adminId = req.user.id;

    if (!eventId) {
      return res.status(400).json({ success: false, message: 'eventId is required.' });
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: { organiser: { select: { id: true, fullName: true, phone: true } } },
    });

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found.' });
    }

    const heldPayments = await prisma.payment.findMany({
      where: {
        status: 'SUCCESS',
        escrowStatus: 'HELD',
        order: { ticket: { eventId } },
      },
      include: { order: true },
    });

    if (heldPayments.length === 0) {
      return res.status(400).json({ success: false, message: 'No held payments found for this event.' });
    }

    const totalPayout = heldPayments.reduce((s, p) => s + Number(p.organizerShare), 0);
    const simulatedReceipt = `SIM${Date.now()}`;

    const result = await prisma.$transaction(async (tx) => {
      const payout = await tx.payout.create({
        data: {
          organizerId: event.organiserId,
          eventId,
          amount: totalPayout,
          status: 'PAID',
          mpesaReceiptNumber: simulatedReceipt,
          initiatedById: adminId,
          notes: notes || `Payout for event: ${event.title}`,
          paidAt: new Date(),
        },
        include: {
          organizer: { select: { fullName: true, email: true, phone: true } },
          event: { select: { title: true } },
        },
      });

      for (const payment of heldPayments) {
        await tx.payment.update({
          where: { id: payment.id },
          data: { escrowStatus: 'RELEASED', releasedAt: new Date() },
        });
      }

      return payout;
    });

    return res.status(200).json({
      success: true,
      message: `KES ${totalPayout.toLocaleString()} released to ${event.organiser.fullName}. (Simulated M-Pesa B2C)`,
      data: result,
    });
  } catch (error) {
    console.error('[releaseEventPayout]', error);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

const refundOrder = async (req, res) => {
  try {
    const { orderId, reason } = req.body;
    const adminId = req.user.id;

    if (!orderId) {
      return res.status(400).json({ success: false, message: 'orderId is required.' });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        payment: true,
        ticket: { include: { event: true } },
      },
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    if (order.status !== 'CONFIRMED') {
      return res.status(400).json({ success: false, message: 'Only confirmed orders can be refunded.' });
    }

    if (!order.payment || order.payment.status !== 'SUCCESS') {
      return res.status(400).json({ success: false, message: 'No successful payment found for this order.' });
    }

    if (order.payment.escrowStatus === 'RELEASED') {
      return res.status(400).json({
        success: false,
        message: 'Cannot refund — funds have already been released to the organizer.',
      });
    }

    if (order.payment.escrowStatus === 'REFUNDED') {
      return res.status(400).json({ success: false, message: 'This order has already been refunded.' });
    }

    const refundReason = reason || 'Refund initiated by admin';

    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: orderId },
        data: { status: 'REFUNDED' },
      });

      await tx.payment.update({
        where: { id: order.payment.id },
        data: {
          status: 'REFUNDED',
          escrowStatus: 'REFUNDED',
          refundedAt: new Date(),
          refundReason,
        },
      });

      await restoreTicketStock(tx, order.ticketId, order.quantity);

      const qr = await tx.qRCode.findUnique({ where: { qrToken: orderId } });
      if (qr) {
        await tx.qRCode.update({
          where: { id: qr.id },
          data: { invalidated: true },
        });
      }
    });

    console.log(`[refundOrder] Admin ${adminId} refunded order ${orderId}`);

    return res.status(200).json({
      success: true,
      message: `Refund of KES ${Number(order.totalAmount).toLocaleString()} initiated. (Simulated M-Pesa refund)`,
      data: { orderId, amount: order.totalAmount, reason: refundReason },
    });
  } catch (error) {
    console.error('[refundOrder]', error);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

module.exports = { getPaymentLedger, releaseEventPayout, refundOrder };
