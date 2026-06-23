const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Create a new pending order
const createOrder = async (req, res) => {
  try {
    const { ticketId, quantity } = req.body;
    const attendeeId = req.user.id;

    if (!ticketId || !quantity || quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: 'ticketId and a positive quantity are required.',
      });
    }

    // Find the ticket tier
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

    // Use transaction to create order and decrement quantity available
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
          ticket: {
            include: {
              event: true,
            },
          },
        },
      });

      await tx.ticket.update({
        where: { id: ticket.id },
        data: {
          quantityAvailable: ticket.quantityAvailable - quantity,
        },
      });

      return newOrder;
    });

    return res.status(201).json({
      success: true,
      message: 'Order created successfully. Please proceed to payment.',
      data: order,
    });
  } catch (error) {
    console.error('[createOrder]', error);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// Retrieve confirmed tickets/orders for current user
const getMyTickets = async (req, res) => {
  try {
    const attendeeId = req.user.id;

    // Fetch all confirmed orders
    const orders = await prisma.order.findMany({
      where: {
        attendeeId,
        status: 'CONFIRMED',
      },
      include: {
        ticket: {
          include: {
            event: {
              include: {
                category: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Fetch matching QR codes (where qrToken is the order ID)
    const orderIds = orders.map(o => o.id);
    const qrCodes = await prisma.qRCode.findMany({
      where: {
        qrToken: { in: orderIds },
      },
    });

    // Map QR codes to their respective orders
    const qrMap = {};
    qrCodes.forEach(qr => {
      qrMap[qr.qrToken] = qr;
    });

    const tickets = orders.map(order => ({
      ...order,
      qrCode: qrMap[order.id] || null,
    }));

    return res.status(200).json({
      success: true,
      count: tickets.length,
      data: tickets,
    });
  } catch (error) {
    console.error('[getMyTickets]', error);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// Get status of a single order
const getOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        payment: true,
        ticket: {
          include: {
            event: true,
          },
        },
      },
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    // Auth check: attendee or event organizer or admin
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

module.exports = { createOrder, getMyTickets, getOrderStatus };
