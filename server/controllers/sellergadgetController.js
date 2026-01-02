const Product = require('../models/Product');
const Category = require('../models/Category');
const mongoose = require('mongoose');
const { cloudinary, deleteImage } = require('../config/cloudinary');

// Upload product images
exports.uploadProductImages = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No images uploaded'
      });
    }

    console.log('Uploaded files:', req.files.length);

    // Extract image data from Cloudinary upload
    const imageData = req.files.map(file => ({
      url: file.path, // Cloudinary URL
      publicId: file.filename, // Cloudinary public ID
      originalName: file.originalname,
      size: file.size,
      format: file.format || 'jpg'
    }));

    console.log('Image data:', imageData);

    res.json({
      success: true,
      data: imageData.map(img => img.url), // Return URLs for frontend
      imageDetails: imageData, // Full details if needed
      message: `${req.files.length} image(s) uploaded successfully`
    });

  } catch (error) {
    console.error('Error in uploadProductImages:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload images',
      error: error.message
    });
  }
};

// Upload product videos
exports.uploadProductVideos = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No videos uploaded'
      });
    }

    console.log('Uploaded video files:', req.files.length);

    // Extract video data from Cloudinary upload
    const videoData = req.files.map(file => ({
      url: file.path, // Cloudinary URL
      publicId: file.filename, // Cloudinary public ID
      originalName: file.originalname,
      size: file.size,
      format: file.format || 'mp4',
      resource_type: 'video'
    }));

    console.log('Video data:', videoData);

    res.json({
      success: true,
      data: videoData.map(video => video.url), // Return URLs for frontend
      videoDetails: videoData, // Full details if needed
      message: `${req.files.length} video(s) uploaded successfully`
    });

  } catch (error) {
    console.error('Error in uploadProductVideos:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload videos',
      error: error.message
    });
  }
};

// Delete product image from Cloudinary
exports.deleteProductImage = async (req, res) => {
  try {
    const { publicId } = req.params;

    if (!publicId) {
      return res.status(400).json({
        success: false,
        message: 'Public ID is required'
      });
    }

    const result = await deleteImage(publicId);

    res.json({
      success: true,
      data: result,
      message: 'Image deleted successfully'
    });

  } catch (error) {
    console.error('Error in deleteProductImage:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete image',
      error: error.message
    });
  }
};

// Create new product (updated with better image handling)
exports.createProduct = async (req, res) => {
  try {
    const sellerId = req.user._id;
    const productData = { ...req.body };
    console.log(productData.weightoption);
    // Validate required fields
    if (!productData.title || !productData.description || !productData.price) {
      return res.status(400).json({
        success: false,
        message: 'Title, description, and price are required'
      });
    }

    // Find category by name or use the provided category ID
    let categoryId = null;
    
    if (productData.categoryName) {
      const category = await Category.findOne({
        name: { $regex: new RegExp(productData.categoryName, 'i') }
      }).select('_id name');

      if (!category) {
        return res.status(400).json({
          success: false,
          message: `Category "${productData.categoryName}" not found`
        });
      }
      
      categoryId = category._id;
      console.log(`Found category: ${category.name} with ID: ${categoryId}`);
    } 
    else if (productData.category) {
      if (mongoose.Types.ObjectId.isValid(productData.category)) {
        const category = await Category.findById(productData.category);
        if (!category) {
          return res.status(400).json({
            success: false,
            message: 'Invalid category ID provided'
          });
        }
        categoryId = productData.category;
      }
    } 
    else {
      // Default to gadgets category
      const gadgetCategory = await Category.findOne({
        $or: [
          { name: { $regex: /gadget/i } },
          { name: { $regex: /electronics/i } },
          { _id: mongoose.Types.ObjectId('690d9f30a61f9dd9584fde92') }
        ]
      }).select('_id name');

      if (gadgetCategory) {
        categoryId = gadgetCategory._id;
        console.log(`Using default gadget category: ${gadgetCategory.name} with ID: ${categoryId}`);
      }
    }

    if (!categoryId) {
      return res.status(400).json({
        success: false,
        message: 'Category is required and no default gadget category found'
      });
    }

    // Process images - ensure they have proper structure
    let processedImages = [];
    if (productData.images && Array.isArray(productData.images)) {
      processedImages = productData.images.map((img, index) => {
        if (typeof img === 'string') {
          // If it's just a URL string, convert to proper structure
          return {
            url: img,
            alt: `${productData.title} - Image ${index + 1}`,
            isPrimary: index === 0
          };
        } else {
          // If it's already an object, ensure it has required fields
          return {
            url: img.url,
            alt: img.alt || `${productData.title} - Image ${index + 1}`,
            isPrimary: img.isPrimary || index === 0,
            publicId: img.publicId // Store Cloudinary public ID for future deletion
          };
        }
      });
    }

    // Prepare product data with the found category ID
    const finalProductData = {
      title: productData.title,
      weightOptions: productData.weightoption,
      description: productData.description,
      shortDescription: productData.shortDescription || '',
      price: parseFloat(productData.price),
      originalPrice: productData.originalPrice ? parseFloat(productData.originalPrice) : undefined,
      discountPrice: productData.discountPrice ? parseFloat(productData.discountPrice) : undefined,
      stock: parseInt(productData.stock) || 0,
      category: categoryId,
      subCategory: productData.subCategory || '',
      tags: productData.tags || ['gadget'],
      specifications: productData.specifications || [],
      images: processedImages,
      weight: productData.weight ? parseFloat(productData.weight) : undefined,
      isActive: productData.isActive !== undefined ? productData.isActive : true,
      featured: productData.featured || false,
      seller: sellerId,
      createdBy: sellerId
    };

    // Create slug from title
    finalProductData.slug = productData.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') + '-' + Date.now();

    // Calculate discount percentage
    if (finalProductData.originalPrice && finalProductData.originalPrice > finalProductData.price) {
      finalProductData.discount = ((finalProductData.originalPrice - finalProductData.price) / finalProductData.originalPrice) * 100;
    }

    console.log('Creating product with images:', processedImages.length);

    const product = new Product(finalProductData);
    await product.save();

    // Populate for response
    await product.populate('category', 'name slug description');
    await product.populate('seller', 'name email');

    res.status(201).json({
      success: true,
      data: product,
      message: 'Product created successfully'
    });

  } catch (error) {
    console.error('Error in createProduct:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create product',
      error: error.message
    });
  }
};

// Update product (updated with image handling)
exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const sellerId = req.user._id;

    const existingProduct = await Product.findOne({ _id: id, seller: sellerId });
    if (!existingProduct) {
      return res.status(404).json({
        success: false,
        message: 'Product not found or you do not have permission to update it'
      });
    }

    const productData = { ...req.body };
    let updateData = { ...productData };

    // Handle category update
    if (productData.categoryName) {
      const category = await Category.findOne({
        name: { $regex: new RegExp(productData.categoryName, 'i') }
      }).select('_id name');

      if (!category) {
        return res.status(400).json({
          success: false,
          message: `Category "${productData.categoryName}" not found`
        });
      }
      
      updateData.category = category._id;
    } 
    else if (productData.category && mongoose.Types.ObjectId.isValid(productData.category)) {
      const category = await Category.findById(productData.category);
      if (!category) {
        return res.status(400).json({
          success: false,
          message: 'Invalid category ID provided'
        });
      }
      updateData.category = productData.category;
    }

    // Process images
    if (updateData.images && Array.isArray(updateData.images)) {
      updateData.images = updateData.images.map((img, index) => {
        if (typeof img === 'string') {
          return {
            url: img,
            alt: `${updateData.title || existingProduct.title} - Image ${index + 1}`,
            isPrimary: index === 0
          };
        } else {
          return {
            url: img.url,
            alt: img.alt || `${updateData.title || existingProduct.title} - Image ${index + 1}`,
            isPrimary: img.isPrimary || index === 0,
            publicId: img.publicId
          };
        }
      });
    }

    // Update slug if title changed
    if (updateData.title && updateData.title !== existingProduct.title) {
      updateData.slug = updateData.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '') + '-' + Date.now();
    }

    // Parse numeric fields
    if (updateData.price) updateData.price = parseFloat(updateData.price);
    if (updateData.originalPrice) updateData.originalPrice = parseFloat(updateData.originalPrice);
    if (updateData.discountPrice) updateData.discountPrice = parseFloat(updateData.discountPrice);
    if (updateData.stock) updateData.stock = parseInt(updateData.stock);
    if (updateData.weight) updateData.weight = parseFloat(updateData.weight);

    // Calculate discount
    if (updateData.originalPrice && updateData.price && updateData.originalPrice > updateData.price) {
      updateData.discount = ((updateData.originalPrice - updateData.price) / updateData.originalPrice) * 100;
    } else {
      updateData.discount = 0;
    }

    delete updateData.categoryName;

    const product = await Product.findByIdAndUpdate(
      id,
      { ...updateData, updatedAt: new Date() },
      { new: true, runValidators: true }
    )
      .populate('category', 'name slug description')
      .populate('seller', 'name email');

    res.json({
      success: true,
      data: product,
      message: 'Product updated successfully'
    });

  } catch (error) {
    console.error('Error in updateProduct:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update product',
      error: error.message
    });
  }
};

// Other existing functions remain the same...
exports.getSellerProducts = async (req, res) => {
  try {
    const sellerId = req.user._id;
    const { 
      page = 1, 
      limit = 20, 
      search, 
      category,
      status = 'all',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const query = { seller: sellerId };

    if (category && category !== 'all') {
      if (mongoose.Types.ObjectId.isValid(category)) {
        query.category = mongoose.Types.ObjectId(category);
      } else {
        const categoryDoc = await Category.findOne({
          name: { $regex: new RegExp(category, 'i') }
        });
        if (categoryDoc) {
          query.category = categoryDoc._id;
        }
      }
    }

    if (status !== 'all') {
      query.isActive = status === 'active';
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    const skip = (Math.max(1, Number(page)) - 1) * Math.max(1, Number(limit));
    
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const products = await Product.find(query)
      .populate('category', 'name slug')
      .populate('seller', 'name email')
      .sort(sortOptions)
      .skip(skip)
      .limit(Number(limit))
      .lean();

    const total = await Product.countDocuments(query);
    const totalPages = Math.ceil(total / Number(limit));

    res.json({
      success: true,
      data: products,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages,
        hasNext: Number(page) < totalPages,
        hasPrev: Number(page) > 1
      }
    });

  } catch (error) {
    console.error('Error in getSellerProducts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch products',
      error: error.message
    });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const sellerId = req.user._id;

    const product = await Product.findOne({ _id: id, seller: sellerId });
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found or you do not have permission to delete it'
      });
    }

    // Delete associated images from Cloudinary
    if (product.images && product.images.length > 0) {
      for (const image of product.images) {
        if (image.publicId) {
          try {
            await deleteImage(image.publicId);
          } catch (error) {
            console.error('Error deleting image from Cloudinary:', error);
            // Continue with product deletion even if image deletion fails
          }
        }
      }
    }

    await Product.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Product deleted successfully'
    });

  } catch (error) {
    console.error('Error in deleteProduct:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete product',
      error: error.message
    });
  }
};

exports.getCategories = async (req, res) => {
  try {
    let categories = await Category.find({ isActive: true })
      .sort({ name: 1 })
      .lean();

    // If no categories exist, create default ones
    if (categories.length === 0) {
      const defaultCategories = [
        { name: 'Electronics', slug: 'electronics', isActive: true, sortOrder: 1 },
        { name: 'Gadgets', slug: 'gadgets', isActive: true, sortOrder: 2 },
        { name: 'Mobile & Accessories', slug: 'mobile-accessories', isActive: true, sortOrder: 3 },
        { name: 'Other', slug: 'other', isActive: true, sortOrder: 4 }
      ];
      
      await Category.insertMany(defaultCategories);
      categories = await Category.find({ isActive: true }).sort({ name: 1 }).lean();
    }

    console.log('Categories found:', categories.length);
    res.json({
      success: true,
      data: categories
    });

  } catch (error) {
    console.error('Error in getCategories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories',
      error: error.message
    });
  }
};

exports.getOrCreateGadgetCategory = async (req, res) => {
  try {
    let gadgetCategory = await Category.findById('690d9f30a61f9dd9584fde92');
    
    if (!gadgetCategory) {
      gadgetCategory = await Category.findOne({
        $or: [
          { name: { $regex: /gadget/i } },
          { name: { $regex: /electronics/i } }
        ]
      });
    }

    if (!gadgetCategory) {
      gadgetCategory = new Category({
        _id: mongoose.Types.ObjectId('690d9f30a61f9dd9584fde92'),
        name: 'Gadgets',
        slug: 'electronics-gadgets',
        description: 'Mobile phones, tablets, laptops, and other electronic gadgets',
        type: 'product',
        isActive: true,
        seoData: {
          metaTitle: 'Electronics & Gadgets - Best Deals Online',
          metaDescription: 'Shop for the latest electronics and gadgets including mobile phones, tablets, laptops and more.',
          keywords: ['electronics', 'gadgets', 'mobile', 'smartphones', 'tablets', 'laptops']
        }
      });
      
      await gadgetCategory.save();
      console.log('Created gadget category with ID:', gadgetCategory._id);
    }

    res.json({
      success: true,
      data: gadgetCategory,
      message: gadgetCategory.isNew ? 'Gadget category created' : 'Gadget category found'
    });

  } catch (error) {
    console.error('Error in getOrCreateGadgetCategory:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get or create gadget category',
      error: error.message
    });
  }
};