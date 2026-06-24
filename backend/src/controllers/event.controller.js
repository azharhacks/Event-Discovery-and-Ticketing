const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const getAllEvents = async (req, res) => {
  try {
    const { categoryId, date } = req.query;

    const where = { status: 'APPROVED' };

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (date) {
      // Filter events on a specific date (YYYY-MM-DD)
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      where.eventDate = { gte: startOfDay, lte: endOfDay };
    }

    const events = await prisma.event.findMany({
      where,
      include: {
        category: { select: { id: true, name: true } },
        organiser: { select: { id: true, fullName: true, email: true } },
        _count: { select: { tickets: true } },
      },
      orderBy: { eventDate: 'asc' },
    });

    return res.status(200).json({
      success: true,
      count: events.length,
      data: events,
    });
  } catch (error) {
    console.error('[getAllEvents]', error);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// get a single event id...its like a event filter typething
const getEventById = async (req, res) => {
  try {
    const { id } = req.params;

    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        category: true,
        organiser: { select: { id: true, fullName: true, email: true, phone: true } },
        tickets: {
          select: {
            id: true,
            ticketType: true,
            price: true,
            quantityAvailable: true,
            status: true,
          },
        },
      },
    });

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found.' });
    }

    return res.status(200).json({ success: true, data: event });
  } catch (error) {
    console.error('[getEventById]', error);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// create a new event
const createEvent = async (req, res) => {
  try {
    const {
      categoryId,
      title,
      description,
      venue,
      eventDate,
      eventTime,
      ticketPrice,
      capacity,
      bannerUrl,
    } = req.body;

    // req.user is set by the auth middleware
    const organiserId = req.user.id;

    if (!categoryId || !title || !description || !venue || !eventDate || !eventTime || !ticketPrice || !capacity) {
      return res.status(400).json({
        success: false,
        message: 'All fields (categoryId, title, description, venue, eventDate, eventTime, ticketPrice, capacity) are required.',
      });
    }

    // Verify category exists
    const category = await prisma.category.findUnique({ where: { id: categoryId } });
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found.' });
    }

    const event = await prisma.$transaction(async (tx) => {
      const newEvent = await tx.event.create({
        data: {
          organiserId,
          categoryId,
          title,
          description,
          venue,
          eventDate: new Date(eventDate),
          eventTime,
          ticketPrice: parseFloat(ticketPrice),
          capacity: parseInt(capacity, 10),
          bannerUrl: bannerUrl || null,
          status: 'PENDING',
        },
        include: {
          category: { select: { id: true, name: true } },
        },
      });

      // Automatically create a default REGULAR ticket record
      await tx.ticket.create({
        data: {
          eventId: newEvent.id,
          ticketType: 'REGULAR',
          price: parseFloat(ticketPrice),
          quantityAvailable: parseInt(capacity, 10),
          status: 'CONFIRMED',
        },
      });

      return newEvent;
    });

    return res.status(201).json({
      success: true,
      message: 'Event submitted for review. It will be visible once approved.',
      data: event,
    });
  } catch (error) {
    console.error('[createEvent]', error);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};


//dmin approves or rejects an event

const updateEventStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['APPROVED', 'REJECTED', 'CANCELLED', 'COMPLETED'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Status must be one of: ${validStatuses.join(', ')}.`,
      });
    }

    const event = await prisma.event.findUnique({ where: { id } });
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found.' });
    }

    const updated = await prisma.event.update({
      where: { id },
      data: { status },
      include: {
        category: { select: { id: true, name: true } },
        organiser: { select: { id: true, fullName: true, email: true } },
      },
    });

    return res.status(200).json({
      success: true,
      message: `Event status updated to ${status}.`,
      data: updated,
    });
  } catch (error) {
    console.error('[updateEventStatus]', error);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// Admin only: get all pending events
const getPendingEvents = async (req, res) => {
  try {
    const events = await prisma.event.findMany({
      where: { status: 'PENDING' },
      include: {
        category: { select: { id: true, name: true } },
        organiser: { select: { id: true, fullName: true, email: true } },
      },
      orderBy: { eventDate: 'asc' },
    });

    return res.status(200).json({ success: true, data: events });
  } catch (error) {
    console.error('[getPendingEvents]', error);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// Admin only: get ALL events regardless of status
const getAdminAllEvents = async (req, res) => {
  try {
    const events = await prisma.event.findMany({
      include: {
        category:  { select: { id: true, name: true } },
        organiser: { select: { id: true, fullName: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return res.status(200).json({ success: true, data: events });
  } catch (error) {
    console.error('[getAdminAllEvents]', error);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// Organizer only: get all events created by logged-in organizer
const getOrganizerEvents = async (req, res) => {
  try {
    const organiserId = req.user.id;
    const events = await prisma.event.findMany({
      where: { organiserId },
      include: {
        category: { select: { id: true, name: true } },
        tickets: {
          select: {
            id: true,
            ticketType: true,
            price: true,
            quantityAvailable: true,
            status: true,
          },
        },
        _count: {
          select: {
            tickets: true,
          },
        },
      },
      orderBy: { eventDate: 'asc' },
    });

    return res.status(200).json({ success: true, data: events });
  } catch (error) {
    console.error('[getOrganizerEvents]', error);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// Organizer only: edit own event (resets to PENDING if it was APPROVED)
const updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const organiserId = req.user.id;
    const { categoryId, title, description, venue, eventDate, eventTime, ticketPrice, capacity, bannerUrl } = req.body;

    if (!title || !description || !venue || !eventDate || !eventTime || ticketPrice == null || !capacity) {
      return res.status(400).json({ success: false, message: 'All required fields must be provided.' });
    }

    const event = await prisma.event.findUnique({
      where: { id },
      include: { tickets: { select: { id: true, quantityAvailable: true } } },
    });

    if (!event) return res.status(404).json({ success: false, message: 'Event not found.' });
    if (event.organiserId !== organiserId) return res.status(403).json({ success: false, message: 'Access denied.' });
    if (['CANCELLED', 'COMPLETED'].includes(event.status)) {
      return res.status(400).json({ success: false, message: 'Cannot edit a cancelled or completed event.' });
    }

    const wasApproved = event.status === 'APPROVED';

    const updated = await prisma.$transaction(async (tx) => {
      const updatedEvent = await tx.event.update({
        where: { id },
        data: {
          categoryId: categoryId || event.categoryId,
          title,
          description,
          venue,
          eventDate: new Date(eventDate),
          eventTime,
          ticketPrice: parseFloat(ticketPrice),
          capacity: parseInt(capacity, 10),
          bannerUrl: bannerUrl || null,
          status: wasApproved ? 'PENDING' : event.status,
        },
        include: { category: { select: { id: true, name: true } } },
      });

      if (event.tickets.length > 0) {
        const ticket = event.tickets[0];
        const sold = event.capacity - ticket.quantityAvailable;
        const newAvailable = Math.max(0, parseInt(capacity, 10) - sold);
        await tx.ticket.update({
          where: { id: ticket.id },
          data: { price: parseFloat(ticketPrice), quantityAvailable: newAvailable },
        });
      }

      return updatedEvent;
    });

    return res.status(200).json({
      success: true,
      message: wasApproved ? 'Event updated. Status reset to PENDING for re-review.' : 'Event updated successfully.',
      data: updated,
    });
  } catch (error) {
    console.error('[updateEvent]', error);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// Organizer/Admin only: get all confirmed attendees for an event
const getEventAttendees = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const event = await prisma.event.findUnique({ where: { id } });
    if (!event) return res.status(404).json({ success: false, message: 'Event not found.' });

    const isOrganizer = event.organiserId === userId;
    const isAdmin = req.user.role === 'ADMIN';
    if (!isOrganizer && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const orders = await prisma.order.findMany({
      where: { status: 'CONFIRMED', ticket: { eventId: id } },
      include: {
        attendee: { select: { id: true, fullName: true, email: true, phone: true } },
        ticket:   { select: { ticketType: true, price: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json({ success: true, count: orders.length, data: orders, event });
  } catch (error) {
    console.error('[getEventAttendees]', error);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

module.exports = {
  getAllEvents,
  getEventById,
  createEvent,
  updateEvent,
  updateEventStatus,
  getPendingEvents,
  getOrganizerEvents,
  getAdminAllEvents,
  getEventAttendees,
};
