// Fixed version of productController.js with corrected seller population
const Product = require('../models/Product');
const Category = require('../models/Category');
const mongoose = require('mongoose');
const { uploadToCloudinary } = require('../utils/cloudinary');

const productController = {
  // ... (keep all other functions the same)

  // Get all products with filtering
  getAllProducts: async (req, res) => {
    try {
      const {
        page = 1,
        limit = 12,
        category,
        minPrice,
        maxPrice,
        rating,
        featured,
        search,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;

      const skip = (page - 1) * limit;
      const query = { isActive: true };

      // ... (keep existing filter logic)

      // Check if we should populate seller data
      const shouldPopulateSeller = req.query.populate === 'seller';
      
      let productsQuery = Product.find(query)
        .populate('category', 'name slug');
        
      if (shouldPopulateSeller) {
        productsQuery = productsQuery.populate({
          path: 'seller',
          select: 'sellerProfile'
        });
      }
      
      const products = await productsQuery
        .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean();
        
      // Add storeStatus to each product if seller is populated
      if (shouldPopulateSeller) {
        products.forEach(product => {
          if (product.seller && product.seller.sellerProfile) {
            product.storeStatus = product.seller.sellerProfile.storeStatus || 'open';
          } else {
            product.storeStatus = 'open'; // Default to open if no store status found
          }
        });
      }

      // ... (rest of the function)
    } catch (error) {
      console.log("Error fetching products:", error);
      res.status(500).json({ message: error.message });
    }
  },

  // Get single product
  getProduct: async (req, res) => {
    try {
      const { id } = req.params;
      const shouldPopulateSeller = req.query.populate === 'seller';
      
      let productQuery = Product.findOne({
        $or: [{ _id: id }, { slug: id }],
        isActive: true
      })
      .populate('category', 'name slug')
      .populate('createdBy', 'name');
      
      if (shouldPopulateSeller) {
        productQuery = productQuery.populate({
          path: 'seller',
          select: 'sellerProfile'
        });
      }
      
      const product = await productQuery.lean();
console.log(product)

      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }
      
      // Add storeStatus to the product if seller is populated
      if (shouldPopulateSeller && product.seller) {
        product.storeStatus = product.seller.sellerProfile?.storeStatus || 'open';
      } else {
        product.storeStatus = 'open'; // Default to open if no store status found
      }

      res.json({ product });
    } catch (error) {
      console.log("Error fetching product:", error);
      res.status(500).json({ message: error.message });
    }
  },

  // Get featured products
  getFeaturedProducts: async (req, res) => {
    try {
      const { category, limit = 6 } = req.query;
      const query = {
        featured: true,
        isActive: true
      };

      // ... (keep existing category filter logic)

      // Check if we should populate seller data
      const shouldPopulateSeller = req.query.populate === 'seller';
      
      let productsQuery = Product.find(query)
        .populate('category', 'name slug');
        
      if (shouldPopulateSeller) {
        productsQuery = productsQuery.populate({
          path: 'seller',
          select: 'sellerProfile'
        });
      }
      
      const products = await productsQuery
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .lean();
        
      // Add storeStatus to each product if seller is populated
      if (shouldPopulateSeller) {
        products.forEach(product => {
          if (product.seller && product.seller.sellerProfile) {
            product.storeStatus = product.seller.sellerProfile.storeStatus || 'open';
          } else {
            product.storeStatus = 'open'; // Default to open if no store status found
          }
        });
      }

      res.json({ products });
    } catch (error) {
      console.log("Error fetching featured products:", error);
      res.status(500).json({ message: error.message });
    }
  },

  // Search products
  searchProducts: async (req, res) => {
    try {
      const { search, category, page = 1, limit = 12 } = req.query;
      const skip = (page - 1) * parseInt(limit);
  
      if (!search) {
        return res.status(400).json({ message: 'Search query required' });
      }
  
      const searchQuery = {
        isActive: true,
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { tags: { $in: [new RegExp(search, 'i')] } }
        ]
      };

      // ... (keep existing category filter logic)
  
      // Check if we should populate seller data
      const shouldPopulateSeller = req.query.populate === 'seller';
      
      let productsQuery = Product.find(searchQuery)
        .populate('category', 'name slug');
        
      if (shouldPopulateSeller) {
        productsQuery = productsQuery.populate({
          path: 'seller',
          select: 'sellerProfile'
        });
      }
      
      const products = await productsQuery
        .sort({ rating: -1, createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean();
        
      // Add storeStatus to each product if seller is populated
      if (shouldPopulateSeller) {
        products.forEach(product => {
          if (product.seller && product.seller.sellerProfile) {
            product.storeStatus = product.seller.sellerProfile.storeStatus || 'open';
          } else {
            product.storeStatus = 'open'; // Default to open if no store status found
          }
        });
      }

      const total = await Product.countDocuments(searchQuery);

      res.json({
        products,
        searchTerm: search,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error("Search error:", error);
      res.status(500).json({ message: error.message });
    }
  },

  // ... (keep all other functions the same)
};

module.exports = productController;