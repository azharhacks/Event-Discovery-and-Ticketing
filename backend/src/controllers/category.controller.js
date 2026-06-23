const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getAllCategories = async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' },
    });
    return res.status(200).json({ success: true, data: categories });
  } catch (error) {
    console.error('[getAllCategories]', error);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

module.exports = { getAllCategories };
