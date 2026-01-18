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
      // Base query - only enforce active status
      const query = { isActive: true };

      // Apply filters
      if (category) {
        // Check if category is a valid ObjectId (could be category or subcategory ID)
        if (mongoose.Types.ObjectId.isValid(category)) {
          query.$or = [
            { category: category },
            { subCategory: category }
          ];
        } else {
          // Fallback to Slug or Tags
          query.$or = [
            { tags: { $in: [category, 'grocery'] } },
            { 'category.slug': category }
          ];
        }

        // Keep simplified tag logic as fallback/legacy support
        if (!query.$or && !query.category && !query.subCategory) {
          query['tags'] = category === 'all' ? 'grocery' : category;
        }
      } else {
        // Default to grocery if nothing specified
        query['tags'] = 'grocery';
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
      if (req.query.seller || req.query.vendor) {
        const sellerId = req.query.seller || req.query.vendor;
        if (mongoose.Types.ObjectId.isValid(sellerId)) {
          query.seller = sellerId;
        }
      }

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
          select: 'sellerProfile name avatar phone',
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
        .lean(); // Optimization: Return plain JS objects instead of Mongoose documents

      // Add storeStatus to each product if seller is populated
      if (shouldPopulateSeller) {
        products.forEach(product => {
          try {
            // Safely access storeStatus with optional chaining
            const storeStatus = product.seller?.sellerProfile?.storeStatus || 'open';
            product.storeStatus = storeStatus;

            // Clean up the response by removing the nested sellerProfile
            // if (product.seller?.sellerProfile) {
            //   delete product.seller.sellerProfile;
            // }
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

  // --- SMART SEARCH ENGINE ---
  // Synonyms Dictionary for "Related Words" features
  searchProducts: async (req, res) => {
    try {
      const { search, category, page = 1, limit = 12 } = req.query;
      const skip = (page - 1) * parseInt(limit);

      if (!search) {
        return res.status(400).json({ message: 'Search query required' });
      }

      // 1. QUERY EXPANSION (Synonyms)
      // Map common user terms to related keywords
      const SYNONYMS = {
        "morning": ["poha", "jalebi", "tea", "coffee", "breakfast", "paratha"],
        "breakfast": ["poha", "jalebi", "samosa", "kachori", "tea"],
        "lunch": ["thali", "rice", "dal", "roti", "sabji", "chawal"],
        "dinner": ["thali", "roti", "curry", "paneer", "biryani"],
        "sweet": ["cake", "pastry", "gulab jamun", "shake", "dessert", "mithai"],
        "gym": ["eggs", "chicken", "protein", "salad", "boiled"],
        "healthy": ["salad", "juice", "fruit", "oats", "khichdi"],
        "fast": ["falahari", "sabudana", "chips", "fruit"],
        "vrat": ["falahari", "sabudana", "chips", "fruit"]
      };

      let searchTerms = [];
      const searchLower = search.toLowerCase();

      // 0. TOKENIZE & CLEAN (Stopwords)
      const STOP_WORDS = new Set([
        'bhai', 'bhiya', 'muje', 'mujhe', 'ko', 'hai', 'h', 'ka', 'ki', 'ke', 'aur', 'and', 'for', 'the', 'with',
        'want', 'eat', 'khana', 'chiye', 'chahiye', 'kro', 'do', 'plz', 'please', 'me', 'in', 'at', 'i', 'to', 'a'
      ]);

      // Split by spaces and special chars
      const rawTokens = searchLower.split(/[\s,.-]+/).filter(t => t.length > 0);

      const validTokens = rawTokens.filter(t => !STOP_WORDS.has(t));

      // If we filtered out everything (e.g. user entered only stopwords "h ko"), use original to be safe
      const tokensToUse = validTokens.length > 0 ? validTokens : rawTokens;

      // Add tokens to search terms
      searchTerms = [...tokensToUse];

      // 1. QUERY EXPANSION (Synonyms) - Check each clean token against synonyms
      Object.keys(SYNONYMS).forEach(key => {
        // If any token matches a proper synonym key (e.g. 'morning'), add its expansion
        if (tokensToUse.some(t => t === key || t.includes(key))) {
          searchTerms = [...searchTerms, ...SYNONYMS[key]];
        }
      });

      // Deduplicate
      searchTerms = [...new Set(searchTerms)];

      // Create Regex for all terms - permissive OR search
      // Escape special regex chars in terms just in case
      const escapedTerms = searchTerms.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
      const searchRegex = new RegExp(escapedTerms.join("|"), 'i');

      console.log(`[Smart Search] Query: "${search}" | Tokens: [${tokensToUse}] | Final Regex: ${searchRegex}`);

      // 2. BUILD AGGREGATION PIPELINE
      const pipeline = [];

      // A. MATCH STAGE (Filter Candidates)
      const matchStage = {
        isActive: true,
        $or: [
          { name: { $regex: searchRegex } },
          { title: { $regex: searchRegex } }, // Cover both name/title
          { description: { $regex: searchRegex } },
          { tags: { $in: searchTerms.map(t => new RegExp(t, 'i')) } }
        ]
      };

      // Apply Category Filter if present
      if (category) {
        if (mongoose.Types.ObjectId.isValid(category)) {
          matchStage.category = new mongoose.Types.ObjectId(category);
        } else {
          // Try to find category by name/slug first (Blocking call, but needed)
          try {
            const catObj = await Category.findOne({
              $or: [
                { name: { $regex: new RegExp(category, 'i') } },
                { slug: { $regex: new RegExp(category, 'i') } }
              ]
            });
            if (catObj) matchStage.category = catObj._id;
          } catch (e) { console.log("Category lookup failed", e); }
        }
      }

      pipeline.push({ $match: matchStage });

      // B. SCORING FIELDS (Add Fields)
      // We calculate relevance score based on WHERE the match was found
      pipeline.push({
        $addFields: {
          // Exact match on Name/Title gets highest score
          score_exact: {
            $cond: [{ $regexMatch: { input: "$name", regex: new RegExp(`^${search}$`, 'i') } }, 20, 0]
          },
          // Partial match on Name gets high score
          score_name: {
            $cond: [{ $regexMatch: { input: "$name", regex: new RegExp(search, 'i') } }, 10, 0]
          },
          // Tag match gets good score
          score_tags: {
            $cond: [{ $gt: [{ $size: { $filter: { input: "$tags", as: "tag", cond: { $regexMatch: { input: "$$tag", regex: searchRegex } } } } }, 0] }, 8, 0]
          },
          // Expanded synonym match in name
          score_synonym: {
            $cond: [{ $regexMatch: { input: "$name", regex: searchRegex } }, 5, 0]
          },
          // Description match is lowest priority
          score_desc: {
            $cond: [{ $regexMatch: { input: "$description", regex: searchRegex } }, 2, 0]
          }
        }
      });

      // C. CALCULATE TOTAL SCORE
      pipeline.push({
        $addFields: {
          totalScore: { $add: ["$score_exact", "$score_name", "$score_tags", "$score_synonym", "$score_desc"] }
        }
      });

      // D. SORT BY SCORE DESCENDING
      pipeline.push({ $sort: { totalScore: -1, rating: -1, createdAt: -1 } });

      // E. FACET FOR PAGINATION
      pipeline.push({
        $facet: {
          metadata: [{ $count: "total" }],
          data: [
            { $skip: skip },
            { $limit: parseInt(limit) },
            // Populate logic lookup (manual lookup in aggregation is hard, so we just return IDs and populate later OR use $lookup)
            // Using $lookup for Seller and Category
            {
              $lookup: {
                from: "categories",
                localField: "category",
                foreignField: "_id",
                as: "category"
              }
            },
            { $unwind: { path: "$category", preserveNullAndEmptyArrays: true } },
            {
              $lookup: {
                from: "users",
                localField: "seller",
                foreignField: "_id",
                as: "seller"
              }
            },
            { $unwind: { path: "$seller", preserveNullAndEmptyArrays: true } },
          ]
        }
      });

      const result = await Product.aggregate(pipeline);

      const products = result[0].data;
      const total = result[0].metadata[0]?.total || 0;

      // F. POST-PROCESSING (Formatting Seller Info)
      // The aggregation $lookup returns the full seller object. We need to format specific fields if needed
      // to match the previous response structure (sellerProfile, storeStatus).
      products.forEach(p => {
        if (p.seller && p.seller.sellerProfile) {
          p.storeStatus = p.seller.sellerProfile.storeStatus || 'open';
          // Security: don't expose password/salt
          delete p.seller.password;
          delete p.seller.salt;
        } else {
          p.storeStatus = 'open';
        }
      });

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
      console.error("Smart Search error:", error);
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
      const { tag, search, limit = 20, page = 1, category, seller } = req.query;
      const query = { isActive: true };

      if (tag) query.tags = tag;
      if (search) query.$text = { $search: search };

      // Handle category filter - support both category name/slug and ObjectId
      if (category) {
        if (mongoose.Types.ObjectId.isValid(category)) {
          query.category = category;
        } else {
          // Try to find category by name or slug
          try {
            const categoryObj = await Category.findOne({
              $or: [
                { name: { $regex: new RegExp(category, 'i') } },
                { slug: { $regex: new RegExp(category, 'i') } }
              ]
            });
            if (categoryObj) {
              query.category = categoryObj._id;
            } else if (category.toLowerCase() === 'foodzone' || category.toLowerCase() === 'food') {
              // Special handling for foodzone - find food-related categories
              const foodCategories = await Category.find({
                $or: [
                  { name: { $regex: /food|foodzone|restaurant/i } },
                  { slug: { $regex: /food|foodzone|restaurant/i } }
                ]
              }).select('_id');
              if (foodCategories.length > 0) {
                query.category = { $in: foodCategories.map(c => c._id) };
              }
            }
          } catch (err) {
            console.log("Error finding category:", err);
          }
        }
      }

      // Handle seller filter
      if (seller) {
        if (mongoose.Types.ObjectId.isValid(seller)) {
          query.seller = seller;
        }
      }

      const skip = (Math.max(1, page) - 1) * Math.max(1, limit);

      // Populate seller and category for better data
      const products = await Product.find(query)
        .populate('seller', 'name email avatar sellerProfile.storeName sellerProfile.storeMedia')
        .populate('category', 'name slug')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean();

      const total = await Product.countDocuments(query);

      res.json({ success: true, data: products, products, total });
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


