const Category = require('../models/Category');
const Product = require('../models/Product');

const categoryController = {
  // Create category
  createCategory: async (req, res) => {
    try {
      const categoryData = req.body;
      
      // Generate slug
      categoryData.slug = req.body.name
        .toLowerCase()
        .replace(/[^a-z0-9 -]/g, '')
        .replace(/\s+/g, '-');

      const category = new Category(categoryData);
      await category.save();

      res.status(201).json({
        message: 'Category created successfully',
        category
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // Get all categories
  getAllCategories: async (req, res) => {
    try {
      const categories = await Category.find({ isActive: true })
        .populate('parent', 'name slug')
        .sort({ sortOrder: 1, name: 1 });

      // Add count for each category
      const categoriesWithCount = await Promise.all(
        categories.map(async (category) => {
          const count = await Product.countDocuments({
            category: category._id,
            isActive: true
          });
          return {
            ...category.toObject(),
            count
          };
        })
      );

      res.json({ categories: categoriesWithCount });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // Get category with products
  getCategoryWithProducts: async (req, res) => {
    try {
      const { slug } = req.params;
      console.log('Category slug:', slug);
      const { page = 1, limit = 1000, sort = 'popularity', search = '' } = req.query;
      const skip = (page - 1) * limit;

      // Handle thali category specially
      let category;
      if (slug.toLowerCase() === 'thali') {
        category = {
          _id: 'thali-category',
          name: 'Thali',
          slug: 'thali',
          description: 'Fresh homestyle thali delivered to your doorstep',
          icon: '🍽️',
          isActive: true
        };
      } else {
        category = await Category.findOne({ slug, isActive: true });
      }

      if (!category) {
        return res.status(404).json({ message: 'Category not found' });
      }

      // Build query
      let query = { isActive: true };
      
      if (category._id !== 'thali-category') {
        query.category = category._id;
      } else {
        // For thali, search in product names or categories
        query.$or = [
          { name: { $regex: 'thali', $options: 'i' } },
          { category: { $in: await Category.find({ name: { $regex: 'thali|meal|food', $options: 'i' } }).select('_id') } }
        ];
      }

      // Add search filter
      if (search) {
        query.name = { $regex: search, $options: 'i' };
      }

      // Apply sorting
      let sortQuery = {};
      switch (sort) {
        case 'price_low_high':
          sortQuery = { price: 1 };
          break;
        case 'price_high_low':
          sortQuery = { price: -1 };
          break;
        case 'rating':
          sortQuery = { rating: -1 };
          break;
        case 'discount':
          sortQuery = { discount: -1 };
          break;
        case 'name':
          sortQuery = { name: 1 };
          break;
        default: // popularity
          sortQuery = { featured: -1, rating: -1, createdAt: -1 };
      }
      // console.log(query,"sort query",sortQuery);
      const products = await Product.find(query)
        .populate('category', 'name slug')
        .sort(sortQuery)
        .skip(skip)
        .limit(parseInt(limit));

      const total = await Product.countDocuments(query);
      // console.log(products);
      res.json({
        category,
        products,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('Category controller error:', error);
      res.status(500).json({ message: error.message });
    }
  }
};

module.exports = categoryController;
