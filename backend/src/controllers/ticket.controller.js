const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Verify ticket QR code scan
const verifyTicket = async (req, res) => {
  try {
    const { qrToken } = req.body;

    if (!qrToken) {
      return res.status(400).json({
        success: false,
        message: 'qrToken is required.',
      });
    }

    // Find the QR Code
    const qrCode = await prisma.qRCode.findUnique({
      where: { qrToken },
      include: {
        ticket: {
          include: {
            event: true,
          },
        },
      },
    });

    if (!qrCode) {
      return res.status(404).json({
        success: false,
        message: 'Invalid ticket. QR code not found.',
      });
    }

    // Fetch the associated order details
    const order = await prisma.order.findUnique({
      where: { id: qrToken },
      include: {
        attendee: {
          select: {
            fullName: true,
            email: true,
          },
        },
      },
    });

    // Check if ticket event is owned by the current organizer
    const isOrganizer = qrCode.ticket.event.organiserId === req.user.id;
    const isAdmin = req.user.role === 'ADMIN';

    if (!isOrganizer && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You do not own this event.',
      });
    }

    if (qrCode.isScanned) {
      return res.status(400).json({
        success: false,
        message: 'Ticket has already been scanned.',
        data: {
          scannedAt: qrCode.scannedAt,
          attendee: order?.attendee || null,
          eventTitle: qrCode.ticket.event.title,
          ticketType: qrCode.ticket.ticketType,
        },
      });
    }

    // Update QR Code to scanned
    const updatedQR = await prisma.qRCode.update({
      where: { id: qrCode.id },
      data: {
        isScanned: true,
        scannedAt: new Date(),
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Ticket verified successfully! Access granted.',
      data: {
        attendee: order?.attendee || null,
        eventTitle: qrCode.ticket.event.title,
        ticketType: qrCode.ticket.ticketType,
        quantity: order?.quantity || 1,
        scannedAt: updatedQR.scannedAt,
      },
    });
  } catch (error) {
    console.error('[verifyTicket]', error);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

module.exports = { verifyTicket };
