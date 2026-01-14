const express = require('express');
const router = express.Router();
const subCategoryController = require('../controllers/subCategoryController');

// Get all subcategories
router.get('/', subCategoryController.getAllSubCategories);

// Get subcategories by category
router.get('/by-category/:categoryId', subCategoryController.getSubCategoriesByCategory);

module.exports = router;
