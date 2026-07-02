const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized. No token provided.',
      });
    }

    const token = authHeader.split(' ')[1];

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized. Token is invalid or expired.',
      });
    }

    const user = await prisma.user.findFirst({
      where: { id: decoded.id, deletedAt: null },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        verified: true,
        status: true,
      },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized. User no longer exists.',
      });
    }

    if (user.status === 'SUSPENDED') {
      return res.status(403).json({
        success: false,
        message: 'Your account has been suspended. Contact support for assistance.',
      });
    }

    if (user.status === 'BANNED') {
      return res.status(403).json({
        success: false,
        message: 'Your account has been banned.',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('[protect]', error);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

const adminOnly = (req, res, next) => {
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).json({
      success: false,
      message: 'Forbidden. Admin access only.',
    });
  }
  next();
};

const organizerOnly = (req, res, next) => {
  if (!req.user || (req.user.role !== 'ORGANIZER' && req.user.role !== 'ADMIN')) {
    return res.status(403).json({
      success: false,
      message: 'Forbidden. Organizer access only.',
    });
  }
  next();
};

module.exports = { protect, adminOnly, organizerOnly };
