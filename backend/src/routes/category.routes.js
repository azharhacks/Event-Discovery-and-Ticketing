const express = require('express');
const { getAllCategories } = require('../controllers/category.controller');

const router = express.Router();

// GET /api/categories - public
router.get('/', getAllCategories);

module.exports = router;
