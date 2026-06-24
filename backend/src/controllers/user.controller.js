const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get logged-in user profile
const getProfile = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
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

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    return res.status(200).json({ success: true, data: user });
  } catch (error) {
    console.error('[getProfile]', error);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// Update user profile details
const updateProfile = async (req, res) => {
  try {
    const { fullName, phone } = req.body;
    const userId = req.user.id;

    if (!fullName) {
      return res.status(400).json({
        success: false,
        message: 'Full name is required.',
      });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        fullName,
        phone: phone || null,
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        role: true,
        verified: true,
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

// Admin only: get all users
const getAllUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        role: true,
        verified: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return res.status(200).json({ success: true, data: users });
  } catch (error) {
    console.error('[getAllUsers]', error);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

module.exports = { getProfile, updateProfile, getAllUsers };
