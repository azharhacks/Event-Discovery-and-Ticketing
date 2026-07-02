const { PrismaClient } = require('@prisma/client');
const { parseQrPayload } = require('../utils/qr');

const prisma = new PrismaClient();

const verifyTicket = async (req, res) => {
  try {
    const { qrToken } = req.body;

    if (!qrToken) {
      return res.status(400).json({ success: false, message: 'qrToken is required.' });
    }

    const parsed = parseQrPayload(qrToken);
    if (!parsed || parsed.error) {
      return res.status(400).json({
        success: false,
        message: parsed?.error || 'Invalid QR code format.',
      });
    }

    const orderId = parsed.orderId;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        attendee: { select: { fullName: true, email: true } },
        ticket: { include: { event: true } },
      },
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Invalid ticket. Order not found.' });
    }

    if (order.status === 'REFUNDED') {
      return res.status(400).json({ success: false, message: 'This ticket has been refunded and is no longer valid.' });
    }

    if (order.status !== 'CONFIRMED') {
      return res.status(400).json({ success: false, message: 'This ticket is not confirmed.' });
    }

    const qrCode = await prisma.qRCode.findUnique({
      where: { qrToken: orderId },
      include: { ticket: { include: { event: true } } },
    });

    if (!qrCode) {
      return res.status(404).json({ success: false, message: 'Invalid ticket. QR code not found.' });
    }

    if (qrCode.invalidated) {
      return res.status(400).json({ success: false, message: 'This ticket has been invalidated (refunded).' });
    }

    const isOrganizer = qrCode.ticket.event.organiserId === req.user.id;
    const isAdmin = req.user.role === 'ADMIN';

    if (!isOrganizer && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Access denied. You do not own this event.' });
    }

    if (qrCode.isScanned) {
      return res.status(400).json({
        success: false,
        message: 'Ticket has already been scanned.',
        data: {
          scannedAt: qrCode.scannedAt,
          attendee: order.attendee,
          eventTitle: qrCode.ticket.event.title,
          ticketType: qrCode.ticket.ticketType,
          quantity: order.quantity,
        },
      });
    }

    const updatedQR = await prisma.qRCode.update({
      where: { id: qrCode.id },
      data: { isScanned: true, scannedAt: new Date() },
    });

    return res.status(200).json({
      success: true,
      message: 'Ticket verified successfully! Access granted.',
      data: {
        attendee: order.attendee,
        eventTitle: qrCode.ticket.event.title,
        ticketType: qrCode.ticket.ticketType,
        quantity: order.quantity,
        scannedAt: updatedQR.scannedAt,
      },
    });
  } catch (error) {
    console.error('[verifyTicket]', error);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

module.exports = { verifyTicket };
