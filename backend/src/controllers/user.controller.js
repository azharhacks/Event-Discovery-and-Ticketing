const { PrismaClient } = require('@prisma/client');
const { splitPayment } = require('../utils/fees');
const { restoreTicketStock } = require('./order.controller');

const prisma = new PrismaClient();

const ACTIVE_USER_FILTER = { deletedAt: null };

const getProfile = async (req, res) => {
  try {
    const user = await prisma.user.findFirst({
      where: { id: req.user.id, ...ACTIVE_USER_FILTER },
      select: {
        id: true, fullName: true, email: true, phone: true,
        role: true, verified: true, status: true, createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    return res.status(200).json({ success: true, data: user });
  } catch (error) {
    console.error('[getProfile]', error);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { fullName, phone } = req.body;
    const userId = req.user.id;

    if (!fullName) {
      return res.status(400).json({ success: false, message: 'Full name is required.' });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { fullName, phone: phone || null },
      select: {
        id: true, fullName: true, email: true, phone: true,
        role: true, verified: true, status: true,
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      data: updatedUser,
    });
  } catch (error) {
    console.error('[updateProfile]', error);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const { status } = req.query;
    const where = { ...ACTIVE_USER_FILTER, role: { not: 'ADMIN' } };
    if (status && ['ACTIVE', 'SUSPENDED', 'BANNED'].includes(status)) {
      where.status = status;
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true, fullName: true, email: true, phone: true,
        role: true, verified: true, status: true, statusReason: true,
        statusChangedAt: true, createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return res.status(200).json({ success: true, data: users });
  } catch (error) {
    console.error('[getAllUsers]', error);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

const updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;

    const validStatuses = ['ACTIVE', 'SUSPENDED', 'BANNED'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Status must be one of: ${validStatuses.join(', ')}.`,
      });
    }

    const target = await prisma.user.findFirst({
      where: { id, deletedAt: null },
    });

    if (!target) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    if (target.role === 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Cannot modify admin accounts.' });
    }

    const updated = await prisma.user.update({
      where: { id },
      data: {
        status,
        statusReason: reason || null,
        statusChangedAt: new Date(),
      },
      select: {
        id: true, fullName: true, email: true, role: true,
        status: true, statusReason: true, statusChangedAt: true,
      },
    });

    const action = status === 'ACTIVE' ? 'reactivated' : status.toLowerCase();
    return res.status(200).json({
      success: true,
      message: `User ${action} successfully.`,
      data: updated,
    });
  } catch (error) {
    console.error('[updateUserStatus]', error);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

const removeUser = async (req, res) => {
  try {
    const { id } = req.params;

    const target = await prisma.user.findFirst({
      where: { id, deletedAt: null },
    });

    if (!target) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    if (target.role === 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Cannot remove admin accounts.' });
    }

    await prisma.user.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        status: 'BANNED',
        statusReason: 'Account removed by admin',
        statusChangedAt: new Date(),
      },
    });

    return res.status(200).json({
      success: true,
      message: 'User removed successfully.',
    });
  } catch (error) {
    console.error('[removeUser]', error);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  getAllUsers,
  updateUserStatus,
  removeUser,
};
