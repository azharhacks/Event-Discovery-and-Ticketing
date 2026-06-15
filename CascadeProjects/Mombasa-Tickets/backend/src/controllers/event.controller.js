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

    const event = await prisma.event.create({
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

module.exports = { getAllEvents, getEventById, createEvent, updateEventStatus };
