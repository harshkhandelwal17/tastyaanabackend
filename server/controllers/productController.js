const Product = require('../models/Product');
const Category = require('../models/Category');
const mongoose = require('mongoose');
// const Category = require('../models/Category');
const { uploadToCloudinary } = require('../utils/cloudinary');

const productController = {
  // Grocery specific endpoints
  getGroceryProducts: async (req, res) => {
    try {
      const { category, minPrice, maxPrice, sortBy, sortOrder, search, page = 1, limit = 10 } = req.query;
      const query = { 'tags': 'grocery', isActive: true };
      
      // Apply filters
      if (category) {
        query['tags'] = { $all: ['grocery', category] };
      }
      
      if (minPrice || maxPrice) {
        query.price = {};
        if (minPrice) query.price.$gte = Number(minPrice);
        if (maxPrice) query.price.$lte = Number(maxPrice);
      }
      
      // Search functionality
      if (search) {
        query.$or = [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { tags: { $regex: search, $options: 'i' } }
        ];
      }
      
      // Sort options
      const sortOptions = {};
      if (sortBy) {
        sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;
      } else {
        sortOptions.createdAt = -1; // Default sort by newest
      }
      
      // Pagination
      const skip = (page - 1) * limit;
      
      // Check if we should populate seller data
      const shouldPopulateSeller = req.query.populate === 'seller';
      
      let productsQuery = Product.find(query)
        .sort(sortOptions)
        .skip(skip)
        .limit(Number(limit))
        .populate('category', 'name slug');
        
      if (shouldPopulateSeller) {
        productsQuery = productsQuery.populate({
          path: 'seller',
          select: 'name email sellerProfile.storeStatus',
          populate: {
            path: 'sellerProfile',
            select: 'storeStatus'
          }
        });
      } else {
        productsQuery = productsQuery.populate('seller', 'name email');
      }
      
      const [products, total] = await Promise.all([
        productsQuery.lean(),
        Product.countDocuments(query)
      ]);
      
      // Add storeStatus to each product if seller is populated
      if (shouldPopulateSeller) {
        products.forEach(product => {
          try {
            // Safely access storeStatus with optional chaining
            const storeStatus = product.seller?.sellerProfile?.storeStatus || 'open';
            product.storeStatus = storeStatus;
            
            // Clean up the response by removing the nested sellerProfile
            if (product.seller?.sellerProfile) {
              delete product.seller.sellerProfile;
            }
          } catch (err) {
            console.error('Error processing seller profile:', err);
            product.storeStatus = 'open';
          }
        });
      }
      
      res.json({
        success: true,
        count: products.length,
        total,
        page: Number(page),
        pages: Math.ceil(total / limit),
        products
      });
      
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },
  
  getGroceryProduct: async (req, res) => {
    try {
      // Check if we should populate seller data
      const shouldPopulateSeller = req.query.populate === 'seller';
      
      let productQuery = Product.findOne({
        _id: req.params.id,
        'tags': 'grocery',
        isActive: true
      })
      .populate('category', 'name slug');
      
      if (shouldPopulateSeller) {
        productQuery = productQuery.populate({
          path: 'seller',
          select: 'name email sellerProfile.storeStatus',
          populate: {
            path: 'sellerProfile',
            select: 'storeStatus'
          }
        });
      } else {
        productQuery = productQuery.populate('seller', 'name email');
      }
      
      const product = await productQuery.lean();
      
      if (!product) {
        return res.status(404).json({ success: false, message: 'Grocery product not found' });
      }
      
      // Add storeStatus to the product if seller is populated
      if (shouldPopulateSeller && product.seller) {
        product.storeStatus = product.seller.sellerProfile?.storeStatus || 'open';
      } else {
        product.storeStatus = 'open'; // Default to open if no store status found
      }
      
      // Increment view count
      await Product.updateOne({ _id: product._id }, { $inc: { views: 1 } });
      
      res.json({ success: true, product });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },
  
  getGroceryCategories: async (req, res) => {
    try {
      const categories = await Product.distinct('tags', { 'tags': { $in: ['grocery'] } });
      // Filter out 'grocery' tag and any other non-category tags
      const groceryCategories = categories.filter(tag => 
        tag !== 'grocery' && !['organic', 'fresh', 'vegetables', 'fruits'].includes(tag)
      );
      
      res.json({ success: true, categories: groceryCategories });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },
  // Create product (Admin/Seller)
  createProduct: async (req, res) => {
    try {
      const productData = {
        ...req.body,
        createdBy: req.user.id
      };

      // Generate slug
      productData.slug = req.body.name
        .toLowerCase()
        .replace(/[^a-z0-9 -]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');

      // Handle image uploads
      if (req.files && req.files.length > 0) {
        const imageUrls = [];
        for (let file of req.files) {
          const result = await uploadToCloudinary(file.buffer);
          imageUrls.push({
            url: result.secure_url,
            alt: req.body.name,
            isPrimary: imageUrls.length === 0
          });
        }
        productData.images = imageUrls;
      }

      const product = new Product(productData);
      await product.save();

      const populatedProduct = await Product.findById(product._id)
        .populate('category', 'name slug');

      res.status(201).json({
        message: 'Product created successfully',
        product: populatedProduct
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // Get all products with filtering
  getAllProducts: async (req, res) => {
    try {
      const {
        page = 1,
        limit = 200,
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

      // Apply filters
      if (category) {
        // console.log("Category filter applied:", category);
        // Check if category is a valid ObjectId
        if (mongoose.Types.ObjectId.isValid(category)) {
          query.category = category;
        } else {
          // If not a valid ObjectId, try to find category by name
          try {
            const categoryObj = await Category.findOne({ 
              $or: [
                { name: { $regex: new RegExp(category, 'i') } },
                { slug: { $regex: new RegExp(category, 'i') } }
              ]
            });
            // console.log(`Found category by name/slug:`, categoryObj);
            if (categoryObj) {
              query.category = categoryObj._id;
            } else {
              // If category not found, return empty results
              return res.json({
                products: [],
                pagination: {
                  page: parseInt(page),
                  limit: parseInt(limit),
                  total: 0,
                  pages: 0
                }
              });
            }
          } catch (err) {
            console.log("Error finding category:", err);
            // Continue with empty category to avoid breaking the API
            return res.json({
              products: [],
              pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: 0,
                pages: 0
              }
            });
          }
        }
      }
      if (featured) query.featured = featured === 'true';
      if (rating) query['ratings.average'] = { $gte: parseFloat(rating) };
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { tags: { $in: [new RegExp(search, 'i')] } }
        ];
      }
      
      // Price filter (check within weightOptions)
      if (minPrice || maxPrice) {
        const priceQuery = {};
        if (minPrice) priceQuery.$gte = parseFloat(minPrice);
        if (maxPrice) priceQuery.$lte = parseFloat(maxPrice);
        query['weightOptions.price'] = priceQuery;
      }
      
      // console.log("request coming ");
      // Check if we should populate seller data
      const shouldPopulateSeller = req.query.populate === 'seller';
      
      let productsQuery = Product.find(query)
        .populate('category', 'name slug');
        
      if (shouldPopulateSeller) {
        productsQuery = productsQuery.populate({
          path: 'seller',
          select: 'sellerProfile',
          populate: {
            path: 'sellerProfile',
            select: 'storeStatus',
            model: 'User'
          }
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
          try {
            // Safely access storeStatus with optional chaining
            const storeStatus = product.seller?.sellerProfile?.storeStatus || 'open';
            product.storeStatus = storeStatus;
            
            // Clean up the response by removing the nested sellerProfile
            if (product.seller?.sellerProfile) {
              delete product.seller.sellerProfile;
            }
          } catch (err) {
            console.error('Error processing seller profile:', err);
            product.storeStatus = 'open';
          }
        });
      }
// console.log("Products fetched:", products.length, products , "from query:", query);
      const total = await Product.countDocuments(query);

      res.json({
        products,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
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

  // Update product
  updateProduct: async (req, res) => {
    try {
      const { id } = req.params;
      const updates = { ...req.body, updatedAt: new Date() };

      // Handle image updates
      if (req.files && req.files.length > 0) {
        const imageUrls = [];
        for (let file of req.files) {
          const result = await uploadToCloudinary(file.buffer);
          imageUrls.push({
            url: result.secure_url,
            alt: req.body.name || 'Product image',
            isPrimary: imageUrls.length === 0
          });
        }
        updates.images = imageUrls;
      }

      const product = await Product.findByIdAndUpdate(
        id,
        updates,
        { new: true, runValidators: true }
      ).populate('category', 'name slug');

      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }

      res.json({
        message: 'Product updated successfully',
        product
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // Delete product
  deleteProduct: async (req, res) => {
    try {
      const { id } = req.params;
      const product = await Product.findByIdAndUpdate(
        id,
        { isActive: false },
        { new: true }
      );

      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }

      res.json({ message: 'Product deleted successfully' });
    } catch (error) {
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

      // Handle category filter
      if (category) {
        // Check if category is a valid ObjectId
        if (mongoose.Types.ObjectId.isValid(category)) {
          query.category = category;
        } else {
          // If not a valid ObjectId, try to find category by name
          try {
            const categoryObj = await Category.findOne({ 
              $or: [
                { name: { $regex: new RegExp(category, 'i') } },
                { slug: { $regex: new RegExp(category, 'i') } }
              ]
            });
            
            if (categoryObj) {
              query.category = categoryObj._id;
            } else {
              // If category not found, return empty results
              return res.json({ products: [] });
            }
          } catch (err) {
            console.log("Error finding category:", err);
            // Continue with empty category to avoid breaking the API
            return res.json({ products: [] });
          }
        }
      }

      // Check if we should populate seller data
      const shouldPopulateSeller = req.query.populate === 'seller';
      
      let productsQuery = Product.find(query)
        .populate('category', 'name slug');
        
      if (shouldPopulateSeller) {
        productsQuery = productsQuery.populate({
          path: 'seller',
          select: 'sellerProfile',
          populate: {
            path: 'sellerProfile',
            select: 'storeStatus',
            model: 'User'
          }
        });
      }
      
      const products = await productsQuery
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .lean();
        
      // Add storeStatus to each product if seller is populated
      if (shouldPopulateSeller) {
        products.forEach(product => {
          try {
            // Safely access storeStatus with optional chaining
            const storeStatus = product.seller?.sellerProfile?.storeStatus || 'open';
            product.storeStatus = storeStatus;
            
            // Clean up the response by removing the nested sellerProfile
            if (product.seller?.sellerProfile) {
              delete product.seller.sellerProfile;
            }
          } catch (err) {
            console.error('Error processing seller profile:', err);
            product.storeStatus = 'open';
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
  
      // console.log("Searching for products with query:", search);
  
      const searchQuery = {
        isActive: true,
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { tags: { $in: [new RegExp(search, 'i')] } }
        ]
      };

      // Handle category filter
      if (category) {
        // Check if category is a valid ObjectId
        if (mongoose.Types.ObjectId.isValid(category)) {
          searchQuery.category = category;
        } else {
          // If not a valid ObjectId, try to find category by name
          try {
            const categoryObj = await Category.findOne({ 
              $or: [
                { name: { $regex: new RegExp(category, 'i') } },
                { slug: { $regex: new RegExp(category, 'i') } }
              ]
            });
            
            if (categoryObj) {
              searchQuery.category = categoryObj._id;
            } else {
              // If category not found, return empty results
              return res.json({
                products: [],
                searchTerm: search,
                pagination: {
                  page: parseInt(page),
                  limit: parseInt(limit),
                  total: 0,
                  pages: 0
                }
              });
            }
          } catch (err) {
            console.log("Error finding category:", err);
            // Continue with empty category to avoid breaking the API
            return res.json({
              products: [],
              searchTerm: search,
              pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: 0,
                pages: 0
              }
            });
          }
        }
      }
  
      // Check if we should populate seller data
      const shouldPopulateSeller = req.query.populate === 'seller';
      
      let productsQuery = Product.find(searchQuery)
        .populate('category', 'name slug');
        
      if (shouldPopulateSeller) {
        productsQuery = productsQuery.populate({
          path: 'seller',
          select: 'sellerProfile',
          populate: {
            path: 'sellerProfile',
            select: 'storeStatus',
            model: 'User'
          }
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
          try {
            // Safely access storeStatus with optional chaining
            const storeStatus = product.seller?.sellerProfile?.storeStatus || 'open';
            product.storeStatus = storeStatus;
            
            // Clean up the response by removing the nested sellerProfile
            if (product.seller?.sellerProfile) {
              delete product.seller.sellerProfile;
            }
          } catch (err) {
            console.error('Error processing seller profile:', err);
            product.storeStatus = 'open';
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

  // Get all unique product categories
  getProductCategories: async (req, res) => {
    try {
      // Mock data for testing
      const mockCategories = [
        {
          _id: '64d5f7a5b4a3f3a1f8d9e0b1',
          name: 'Fruits',
          slug: 'fruits',
          description: 'Fresh and delicious fruits'
        },
        {
          _id: '64d5f7a5b4a3f3a1f8d9e0b2',
          name: 'Vegetables',
          slug: 'vegetables',
          description: 'Fresh and healthy vegetables'
        },
        {
          _id: '64d5f7a5b4a3f3a1f8d9e0b3',
          name: 'Dairy',
          slug: 'dairy',
          description: 'Milk, cheese, and other dairy products'
        },
        {
          _id: '64d5f7a5b4a3f3a1f8d9e0b4',
          name: 'Bakery',
          slug: 'bakery',
          description: 'Freshly baked bread and pastries'
        },
        {
          _id: '64d5f7a5b4a3f3a1f8d9e0b5',
          name: 'Beverages',
          slug: 'beverages',
          description: 'Refreshing drinks and beverages'
        },
        {
          _id: '64d5f7a5b4a3f3a1f8d9e0b6',
          name: 'Snacks',
          slug: 'snacks',
          description: 'Tasty snacks and munchies'
        },
        {
          _id: '64d5f7a5b4a3f3a1f8d9e0b7',
          name: 'Meat & Seafood',
          slug: 'meat-seafood',
          description: 'Fresh meat and seafood products'
        },
        {
          _id: '64d5f7a5b4a3f3a1f8d9e0b8',
          name: 'Frozen Foods',
          slug: 'frozen-foods',
          description: 'Frozen meals and ingredients'
        }
      ];

      try {
        // Try to get categories from the database
        const categories = await Product.distinct('category');
        console.log("Fetched categories from database:", categories);
        const categoryDetails = await Category.find({
          _id: { $in: categories }
        }).select('name slug description');
console.log("Category details from database:", categoryDetails);
        // If we have categories in the database, return them
        if (categoryDetails && categoryDetails.length > 0) {
          return res.status(200).json(categoryDetails);
        }
      } catch (dbError) {
        console.error('Database error, using mock data:', dbError);
      }
      
      // If no categories in database or error occurred, return mock data
      console.log('Using mock category data');
      res.status(200).json(mockCategories);
    } catch (error) {
      console.error('Get product categories error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error fetching product categories', 
        error: error.message 
      });
    }
  },

  // New generic product endpoints
  getProducts: async (req, res) => {
    try {
      const { tag, search, limit = 20, page = 1 } = req.query;
      const query = { isActive: true };

      if (tag) query.tags = tag;
      if (search) query.$text = { $search: search };

      const skip = (Math.max(1, page) - 1) * Math.max(1, limit);
      const products = await Product.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean();
      const total = await Product.countDocuments(query);

      res.json({ success: true, data: products, total });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: err.message });
    }
  },

  getProductById: async (req, res) => {
    try {
      const p = await Product.findById(req.params.id).lean();
      if (!p) return res.status(404).json({ success: false, message: 'Product not found' });
      res.json({ success: true, data: p });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: err.message });
    }
  }
}

module.exports = productController;


