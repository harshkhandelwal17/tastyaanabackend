const SubCategory = require('../models/SubCategory');
const Category = require('../models/Category');

const subCategoryController = {
    // Get all subcategories
    getAllSubCategories: async (req, res) => {
        try {
            const subcategories = await SubCategory.find({ isActive: true })
                .populate('category', 'name slug')
                .sort({ priority: -1, displayOrder: 1, name: 1 });

            res.json({
                success: true,
                data: subcategories
            });
        } catch (error) {
            console.error('Error fetching subcategories:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    },

    // Get subcategories by parent category ID
    getSubCategoriesByCategory: async (req, res) => {
        try {
            const { categoryId } = req.params;
            let queryCategoryId = categoryId;

            // Check if input is a valid ObjectId
            const isValidObjectId = require('mongoose').Types.ObjectId.isValid(categoryId);

            if (!isValidObjectId) {
                // If not ObjectId, try to find category by slug
                const category = await Category.findOne({ slug: categoryId });
                if (!category) {
                    return res.status(404).json({ success: false, message: 'Category not found' });
                }
                queryCategoryId = category._id;
            }

            const subcategories = await SubCategory.find({
                category: queryCategoryId,
                isActive: true
            })
                .populate('category', 'name slug')
                .sort({ priority: -1, displayOrder: 1, name: 1 });

            res.json({
                success: true,
                data: subcategories
            });
        } catch (error) {
            console.error('Error fetching subcategories by category:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    }
};

module.exports = subCategoryController;
