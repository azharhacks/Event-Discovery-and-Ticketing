const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

//register controller
const register = async (req, res) => {
  try {
    const { fullName, email, password, phone, role } = req.body;

    // Validate required fields
    if (!fullName || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Full name, email and password are required.',
      });
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists.',
      });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Determine role (only ATTENDEE or ORGANIZER allowed on self-register)
    const allowedRoles = ['ATTENDEE', 'ORGANIZER'];
    const assignedRole = role && allowedRoles.includes(role) ? role : 'ATTENDEE';

    // Create the user
    const user = await prisma.user.create({
      data: {
        fullName,
        email,
        hashedPassword,
        phone: phone || null,
        role: assignedRole,
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        role: true,
        verified: true,
        createdAt: true,
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      data: user,
    });
  } catch (error) {
    console.error('[register]', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error. Please try again later.',
    });
  }
};


//login controller
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required.',
      });
    }

    // Find user by email
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.hashedPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Return token and sanitised user
    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      token,
      data: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        verified: user.verified,
      },
    });
  } catch (error) {
    console.error('[login]', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error. Please try again later.',
    });
  }
};

module.exports = { register, login };
