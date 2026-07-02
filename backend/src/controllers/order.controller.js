const { PrismaClient } = require('@prisma/client');
const { buildQrPayload } = require('../utils/qr');
const { cancelExpiredOrders } = require('../utils/orderCleanup');
const { restoreTicketStock } = require('../utils/inventory');
const { finalizeOrder, isDemoPaymentsEnabled } = require('../utils/confirmOrder');

const prisma = new PrismaClient();

// Create a new pending order
const createOrder = async (req, res) => {
  try {
    await cancelExpiredOrders();

    const { ticketId, quantity } = req.body;
    const attendeeId = req.user.id;

    if (!ticketId || !quantity || quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: 'ticketId and a positive quantity are required.',
      });
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id: parseInt(ticketId, 10) },
      include: { event: true },
    });

    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket tier not found.' });
    }

    if (ticket.event.status !== 'APPROVED') {
      return res.status(400).json({ success: false, message: 'This event is not approved yet.' });
    }

    if (ticket.quantityAvailable < quantity) {
      return res.status(400).json({
        success: false,
        message: `Insufficient tickets available. Only ${ticket.quantityAvailable} remaining.`,
      });
    }

    const totalAmount = parseFloat(ticket.price) * quantity;

    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          attendeeId,
          ticketId: ticket.id,
          quantity: parseInt(quantity, 10),
          totalAmount,
          status: 'PENDING',
        },
        include: {
          ticket: { include: { event: true } },
        },
      });

      await tx.ticket.update({
        where: { id: ticket.id },
        data: { quantityAvailable: ticket.quantityAvailable - quantity },
      });

      return newOrder;
    });

    return res.status(201).json({
      success: true,
      message: 'Order created successfully. Please proceed to payment within 15 minutes.',
      data: order,
    });
  } catch (error) {
    console.error('[createOrder]', error);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

const getMyTickets = async (req, res) => {
  try {
    const attendeeId = req.user.id;

    const orders = await prisma.order.findMany({
      where: { attendeeId, status: 'CONFIRMED' },
      include: {
        ticket: {
          include: { event: { include: { category: true } } },
        },
        payment: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const orderIds = orders.map((o) => o.id);
    const qrCodes = await prisma.qRCode.findMany({
      where: { qrToken: { in: orderIds } },
    });

    const qrMap = {};
    qrCodes.forEach((qr) => { qrMap[qr.qrToken] = qr; });

    const tickets = orders.map((order) => {
      const eventId = order.ticket?.event?.id;
      const qrPayload = eventId
        ? buildQrPayload(order.id, eventId, order.quantity)
        : null;
      return {
        ...order,
        qrCode: qrMap[order.id] || null,
        qrPayload,
      };
    });

    return res.status(200).json({ success: true, count: tickets.length, data: tickets });
  } catch (error) {
    console.error('[getMyTickets]', error);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

const getOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        payment: true,
        ticket: { include: { event: true } },
      },
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    const isAttendee = order.attendeeId === userId;
    const isOrganizer = order.ticket.event.organiserId === userId;
    const isAdmin = req.user.role === 'ADMIN';

    if (!isAttendee && !isOrganizer && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    return res.status(200).json({ success: true, data: order });
  } catch (error) {
    console.error('[getOrderStatus]', error);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

const getOrderQr = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: { ticket: { include: { event: true } } },
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    if (order.attendeeId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    if (order.status !== 'CONFIRMED') {
      return res.status(400).json({ success: false, message: 'QR code is only available for confirmed orders.' });
    }

    const qr = await prisma.qRCode.findUnique({ where: { qrToken: order.id } });
    if (!qr || qr.invalidated) {
      return res.status(400).json({ success: false, message: 'QR code is not available for this order.' });
    }

    const qrPayload = buildQrPayload(order.id, order.ticket.event.id, order.quantity);

    return res.status(200).json({
      success: true,
      data: {
        orderId: order.id,
        eventTitle: order.ticket.event.title,
        quantity: order.quantity,
        qrPayload,
        isScanned: qr.isScanned,
      },
    });
  } catch (error) {
    console.error('[getOrderQr]', error);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

const getCheckoutOptions = async (req, res) => {
  return res.status(200).json({
    success: true,
    data: { demoPayments: isDemoPaymentsEnabled() },
  });
};

const confirmFreeOrder = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }
    if (order.attendeeId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }
    if (Number(order.totalAmount) !== 0) {
      return res.status(400).json({ success: false, message: 'This order requires payment.' });
    }

    const confirmed = await finalizeOrder(id, { receiptNumber: 'FREE-TICKET', simulated: true });

    return res.status(200).json({
      success: true,
      message: 'Free ticket confirmed! Your QR code is ready.',
      data: confirmed,
    });
  } catch (error) {
    console.error('[confirmFreeOrder]', error);
    return res.status(error.status || 500).json({
      success: false,
      message: error.message || 'Internal server error.',
    });
  }
};

const demoPayOrder = async (req, res) => {
  try {
    if (!isDemoPaymentsEnabled()) {
      return res.status(403).json({ success: false, message: 'Demo payments are not enabled.' });
    }

    const { id } = req.params;

    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }
    if (order.attendeeId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }
    if (Number(order.totalAmount) === 0) {
      return res.status(400).json({ success: false, message: 'Use free ticket confirmation for zero-amount orders.' });
    }

    const confirmed = await finalizeOrder(id, { simulated: true });

    return res.status(200).json({
      success: true,
      message: 'Demo payment successful! Your ticket is ready.',
      data: confirmed,
    });
  } catch (error) {
    console.error('[demoPayOrder]', error);
    return res.status(error.status || 500).json({
      success: false,
      message: error.message || 'Internal server error.',
    });
  }
};

const getAllTransactions = async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      include: {
        attendee: { select: { id: true, fullName: true, email: true } },
        ticket: {
          include: {
            event: {
              select: {
                id: true,
                title: true,
                venue: true,
                organiserId: true,
                organiser: { select: { id: true, fullName: true, email: true } },
              },
            },
          },
        },
        payment: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json({ success: true, count: orders.length, data: orders });
  } catch (error) {
    console.error('[getAllTransactions]', error);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

module.exports = {
  createOrder,
  getMyTickets,
  getOrderStatus,
  getOrderQr,
  getCheckoutOptions,
  confirmFreeOrder,
  demoPayOrder,
  getAllTransactions,
};
