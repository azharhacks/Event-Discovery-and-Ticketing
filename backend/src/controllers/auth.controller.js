const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');
const { sendOtpEmail } = require('../utils/email');

const prisma = new PrismaClient();

const register = async (req, res) => {
  try {
    const { fullName, email, password, phone, role } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Full name, email and password are required.',
      });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists.',
      });
    }

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    const allowedRoles = ['ATTENDEE', 'ORGANIZER'];
    const assignedRole = role && allowedRoles.includes(role) ? role : 'ATTENDEE';

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

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required.',
      });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || user.deletedAt) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    const isMatch = await bcrypt.compare(password, user.hashedPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
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

    await prisma.otpCode.updateMany({
      where: { userId: user.id, used: false },
      data: { used: true },
    });

    const otp = crypto.randomInt(100000, 999999).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.otpCode.create({
      data: { userId: user.id, code: otp, expiresAt },
    });

    await sendOtpEmail(user.email, otp);

    return res.status(200).json({
      success: true,
      requiresOtp: true,
      message: 'Verification code sent to your email.',
      userId: user.id,
    });
  } catch (error) {
    console.error('[login]', error);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

const verifyOtp = async (req, res) => {
  try {
    const { userId, code } = req.body;

    if (!userId || !code) {
      return res.status(400).json({ success: false, message: 'userId and code are required.' });
    }

    const otpRecord = await prisma.otpCode.findFirst({
      where: {
        userId,
        code,
        used: false,
        expiresAt: { gt: new Date() },
      },
    });

    if (!otpRecord) {
      return res.status(401).json({ success: false, message: 'Invalid or expired code.' });
    }

    await prisma.otpCode.update({
      where: { id: otpRecord.id },
      data: { used: true },
    });

    const user = await prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        role: true,
        verified: true,
        status: true,
      },
    });

    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found.' });
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

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      token,
      data: user,
    });
  } catch (error) {
    console.error('[verifyOtp]', error);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

module.exports = { register, login, verifyOtp };
