const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();


//protect middleware
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

    // Fetch the user from DB to ensure they still exist
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        verified: true,
      },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized. User no longer exists.',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('[protect]', error);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};


//admin only middleware
const adminOnly = (req, res, next) => {
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).json({
      success: false,
      message: 'Forbidden. Admin access only.',
    });
  }
  next();
};


//organizer only middleware
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
