// controllers/sellerProductController.js
const Product = require('../models/Product');
const MealPlan = require('../models/MealPlan');
const Order = require('../models/Order');
const Notification = require('../models/Notification');
const { uploadToCloudinary } = require('../utils/cloudinary');

/**
 * Create new product
 */
// exports.createProduct = async (req, res) => {
//   try {
//     const sellerId = req.user._id;
    
//     // Process FormData fields
//     const productData = { ...req.body };
    
//     // Parse JSON strings back to arrays/objects
//     if (productData.tags && typeof productData.tags === 'string') {
//       try {
//         productData.tags = JSON.parse(productData.tags);
//       } catch (e) {
//         productData.tags = [];
//       }
//     }
    
//     if (productData.ingredients && typeof productData.ingredients === 'string') {
//       try {
//         productData.ingredients = JSON.parse(productData.ingredients);
//       } catch (e) {
//         productData.ingredients = [];
//       }
//     }
    
//     if (productData.allergens && typeof productData.allergens === 'string') {
//       try {
//         productData.allergens = JSON.parse(productData.allergens);
//       } catch (e) {
//         productData.allergens = [];
//       }
//     }
    
//     if (productData.specifications && typeof productData.specifications === 'string') {
//       try {
//         productData.specifications = JSON.parse(productData.specifications);
//       } catch (e) {
//         productData.specifications = [];
//       }
//     }

//     // Add seller info
//     productData.seller = sellerId;
//     productData.createdBy = sellerId;

//     // Generate slug from title
//     if (productData.title) {
//       productData.slug = productData.title
//         .toLowerCase()
//         .replace(/[^a-z0-9 -]/g, '')
//         .replace(/\s+/g, '-')
//         .replace(/-+/g, '-');
//     }

//     // Handle image uploads if files are provided
//     if (req.files && req.files.length > 0) {
//       const imageUrls = [];
//       for (let file of req.files) {
//         try {
//           const result = await uploadToCloudinary(file.buffer); // Use buffer for multer memory storage
//           imageUrls.push({
//             url: result.secure_url,
//             alt: productData.title || 'Product image',
//             isPrimary: imageUrls.length === 0
//           });
//         } catch (uploadError) {
//           console.error('Image upload error:', uploadError);
//         }
//       }
//       productData.images = imageUrls;
//     }

//     const product = new Product(productData);
//     await product.save();

//     const populatedProduct = await Product.findById(product._id)
//       .populate('category', 'name slug')
//       .populate('seller', 'name');

//     // Create notification for seller
//     await Notification.create({
//       userId: sellerId,
//       title: 'Product Created Successfully',
//       message: `Your product "${product.title}" has been created and is now available for sale.`,
//       type: 'product',
//       data: { productId: product._id }
//     });

//     res.status(201).json({
//       success: true,
//       message: 'Product created successfully',
//       data: populatedProduct
//     });

//   } catch (error) {
//     console.error('Create product error:', error);
    
//     if (error.code === 11000) {
//       return res.status(400).json({
//         success: false,
//         message: 'Product with this slug already exists'
//       });
//     }
    
//     res.status(500).json({
//       success: false,
//       message: 'Failed to create product',
//       error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
//     });
//   }
// };
exports.createProduct = async (req, res) => {
  try {
    const sellerId = req.user._id;
    
    // Debug logs
    console.log('Request files:', req.files);
    console.log('Request body:', req.body);
    
    // Process FormData fields
    const productData = { ...req.body };
    
    // Parse JSON strings back to arrays/objects
    if (productData.tags && typeof productData.tags === 'string') {
      try {
        productData.tags = JSON.parse(productData.tags);
      } catch (e) {
        productData.tags = productData.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
      }
    }
    
    if (productData.ingredients && typeof productData.ingredients === 'string') {
      try {
        productData.ingredients = JSON.parse(productData.ingredients);
      } catch (e) {
        productData.ingredients = productData.ingredients.split(',').map(ingredient => ingredient.trim()).filter(ingredient => ingredient.length > 0);
      }
    }
    
    if (productData.allergens && typeof productData.allergens === 'string') {
      try {
        productData.allergens = JSON.parse(productData.allergens);
      } catch (e) {
        productData.allergens = productData.allergens.split(',').map(allergen => allergen.trim()).filter(allergen => allergen.length > 0);
      }
    }
    
    if (productData.specifications && typeof productData.specifications === 'string') {
      try {
        productData.specifications = JSON.parse(productData.specifications);
      } catch (e) {
        productData.specifications = [];
      }
    }

    // Add seller info
    productData.seller = sellerId;
    productData.createdBy = sellerId;

    // Generate slug from title
    if (productData.title) {
      productData.slug = productData.title
        .toLowerCase()
        .replace(/[^a-z0-9 -]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
    }

    // Handle image uploads if files are provided
    if (req.files && req.files.length > 0) {
      console.log('Processing images:', req.files.length);
      const imageUrls = [];
      
      for (let file of req.files) {
        try {
          console.log('Uploading file:', file.originalname, 'Size:', file.size);
          const result = await uploadToCloudinary(file.buffer);
          console.log('Upload result:', result.secure_url);
          
          imageUrls.push({
            url: result.secure_url,
            alt: productData.title || 'Product image',
            isPrimary: imageUrls.length === 0
          });
        } catch (uploadError) {
          console.error('Image upload error:', uploadError);
        }
      }
      
      console.log('Final image URLs:', imageUrls);
      productData.images = imageUrls;
    } else {
      console.log('No files to upload');
      productData.images = [];
    }

    console.log('Product data before save:', productData);

    const product = new Product(productData);
    await product.save();

    console.log('Product saved with images:', product.images);

    const populatedProduct = await Product.findById(product._id)
      .populate('category', 'name slug')
      .populate('seller', 'name');

    console.log('Populated product images:', populatedProduct.images);

    // Create notification for seller
    await Notification.create({
      userId: sellerId,
      title: 'Product Created Successfully',
      message: `Your product "${product.title}" has been created and is now available for sale.`,
      type: 'product',
      data: { productId: product._id }
    });

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: populatedProduct
    });

  } catch (error) {
    console.error('Create product error:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Product with this slug already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to create product',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};
/**
 * Update existing product
 */
// exports.updateProduct = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const sellerId = req.user._id;
//     const updates = req.body;

   
//    console.log("updates need to be changed ",updates)
//     // Find product and verify ownership
//     const product = await Product.findOne({ _id: id, seller: sellerId });
//     if (!product) {
//       return res.status(404).json({
//         success: false,
//         message: 'Product not found or you do not have permission to update it'
//       });
//     }

    

//     // Update slug if title is being updated
//     if (updates.title && updates.title !== product.title) {
//       updates.slug = updates.title
//         .toLowerCase()
//         .replace(/[^a-z0-9 -]/g, '')
//         .replace(/\s+/g, '-')
//         .replace(/-+/g, '-');
//     }

//     // Handle image uploads if files are provided
//     if (req.files && req.files.length > 0) {
//       const imageUrls = [];
//       for (let file of req.files) {
//         try {
//           const result = await uploadToCloudinary(file.buffer);
//           imageUrls.push({
//             url: result.secure_url,
//             alt: updates.title || product.title,
//             isPrimary: imageUrls.length === 0
//           });
//         } catch (uploadError) {
//           console.error('Image upload error:', uploadError);
//         }
//       }
//       updates.images = imageUrls;
//     }

//     const updatedProduct = await Product.findByIdAndUpdate(
//       id,
//       { ...updates, updatedAt: new Date() },
//       { new: true, runValidators: true }
//     ).populate('category', 'name slug');

//     res.json({
//       success: true,
//       message: 'Product updated successfully',
//       data: updatedProduct
//     });

//   } catch (error) {
//     console.error('Update product error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to update product',
//       error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
//     });
//   }
// };
const processArrayFields = (data) => {
  const arrayFields = ['tags', 'ingredients', 'allergens', 'specifications'];
  
  arrayFields.forEach(field => {
    if (data[field]) {
      if (typeof data[field] === 'string') {
        try {
          // Try parsing as JSON first
          data[field] = JSON.parse(data[field]);
        } catch (e) {
          // If JSON parsing fails, treat as comma-separated string
          data[field] = data[field].split(',').map(item => item.trim()).filter(item => item.length > 0);
        }
      } else if (Array.isArray(data[field])) {
        // Already an array, just clean it
        data[field] = data[field].filter(item => item && item.trim && item.trim().length > 0);
      }
    }
  });
  
  return data;
};
exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const sellerId = req.user._id;
    
    // Find product and verify ownership
    const product = await Product.findOne({ _id: id, seller: sellerId });
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found or you do not have permission to update it'
      });
    }

    // Process updates with enhanced array handling
    let updates = { ...req.body };
    updates = processArrayFields(updates);

    console.log("Processed updates:", updates);
    console.log("Files received:", req.files?.length || 0);

    // Update slug if title is being updated
    if (updates.title && updates.title !== product.title) {
      updates.slug = updates.title
        .toLowerCase()
        .replace(/[^a-z0-9 -]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
    }

    // Handle image uploads - FIXED LOGIC
    if (req.files && req.files.length > 0) {
      console.log("Processing image uploads...");
      const imageUrls = [];
      
      for (let file of req.files) {
        try {
          console.log("Uploading file:", file.originalname);
          const result = await uploadToCloudinary(file.buffer);
          imageUrls.push({
            url: result.secure_url,
            alt: updates.title || product.title,
            isPrimary: imageUrls.length === 0
          });
          console.log("Image uploaded successfully:", result.secure_url);
        } catch (uploadError) {
          console.error('Image upload error:', uploadError);
        }
      }
      
      if (imageUrls.length > 0) {
        updates.images = imageUrls;
        console.log("Images added to updates:", imageUrls.length);
      }
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      { ...updates, updatedAt: new Date() },
      { new: true, runValidators: true }
    ).populate('category', 'name slug');

    console.log("Product updated successfully:", updatedProduct.images?.length || 0, "images");

    res.json({
      success: true,
      message: 'Product updated successfully',
      data: updatedProduct
    });

  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update product',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Delete product (soft delete by setting isActive to false)
 */
exports.softDeleteProduct = async (req, res) => {
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

    // Check if product has pending orders
    const pendingOrders = await Order.countDocuments({
      'items.product': id,
      status: { $in: ['pending', 'confirmed', 'preparing'] }
    });

    if (pendingOrders > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete product. It has ${pendingOrders} pending orders.`
      });
    }

    // Soft delete by setting isActive to false
    await Product.findByIdAndUpdate(id, { 
      isActive: false,
      updatedAt: new Date()
    });

    res.json({
      success: true,
      message: 'Product deleted successfully'
    });

  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete product',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
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

    // Check if product has pending orders
    const pendingOrders = await Order.countDocuments({
      'items.product': id,
      status: { $in: ['pending', 'confirmed', 'preparing'] }
    });

    if (pendingOrders > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete product. It has ${pendingOrders} pending orders.`
      });
    }

    // Soft delete by setting isActive to false
    await Product.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Product deleted successfully'
    });

  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete product',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};
/**
 * Get single product details
 */
exports.getProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const sellerId = req.user._id;

    const product = await Product.findOne({ _id: id, seller: sellerId })
      .populate('category', 'name slug')
      .populate('seller', 'name email');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Get product performance data
    const performance = await Order.aggregate([
      { $unwind: '$items' },
      { 
        $match: { 
          'items.product': product._id,
          status: { $in: ['delivered', 'confirmed'] }
        } 
      },
      {
        $group: {
          _id: null,
          totalSales: { $sum: '$items.quantity' },
          totalRevenue: { 
            $sum: { $multiply: ['$items.price', '$items.quantity'] } 
          },
          orderCount: { $sum: 1 }
        }
      }
    ]);

    const productWithPerformance = {
      ...product.toObject(),
      performance: performance[0] || {
        totalSales: 0,
        totalRevenue: 0,
        orderCount: 0
      }
    };

    res.json({
      success: true,
      data: productWithPerformance
    });

  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch product',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Create new meal plan
 */
exports.createMealPlan = async (req, res) => {
  try {
    const sellerId = req.user._id;
    
    const mealPlanData = {
      ...req.body,
      createdBy: sellerId
    };

    // Validate pricing structure
    if (!mealPlanData.pricing || !mealPlanData.pricing.oneDay || 
        !mealPlanData.pricing.tenDays || !mealPlanData.pricing.thirtyDays) {
      return res.status(400).json({
        success: false,
        message: 'Complete pricing structure is required (oneDay, tenDays, thirtyDays)'
      });
    }

    // Ensure tier uniqueness per seller
    const existingPlan = await MealPlan.findOne({
      createdBy: sellerId,
      tier: mealPlanData.tier,
      status: 'active'
    });

    if (existingPlan) {
      return res.status(400).json({
        success: false,
        message: `You already have an active ${mealPlanData.tier} tier meal plan`
      });
    }

    const mealPlan = new MealPlan(mealPlanData);
    await mealPlan.save();

    // Create notification for seller
    await Notification.create({
      userId: sellerId,
      title: 'Meal Plan Created Successfully',
      message: `Your ${mealPlan.tier} meal plan "${mealPlan.title}" has been created.`,
      type: 'meal_change',
      data: { mealPlanId: mealPlan._id }
    });

    res.status(201).json({
      success: true,
      message: 'Meal plan created successfully',
      data: mealPlan
    });

  } catch (error) {
    console.error('Create meal plan error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create meal plan',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Update existing meal plan
 */
exports.updateMealPlan = async (req, res) => {
  try {
    const { id } = req.params;
    const sellerId = req.user._id;
    const updates = req.body;

    // Find meal plan and verify ownership
    const mealPlan = await MealPlan.findOne({ _id: id, createdBy: sellerId });
    if (!mealPlan) {
      return res.status(404).json({
        success: false,
        message: 'Meal plan not found or you do not have permission to update it'
      });
    }

    // If tier is being changed, check for conflicts
    if (updates.tier && updates.tier !== mealPlan.tier) {
      const existingPlan = await MealPlan.findOne({
        createdBy: sellerId,
        tier: updates.tier,
        status: 'active',
        _id: { $ne: id }
      });

      if (existingPlan) {
        return res.status(400).json({
          success: false,
          message: `You already have an active ${updates.tier} tier meal plan`
        });
      }
    }

    const updatedMealPlan = await MealPlan.findByIdAndUpdate(
      id,
      { ...updates, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Meal plan updated successfully',
      data: updatedMealPlan
    });

  } catch (error) {
    console.error('Update meal plan error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update meal plan',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Delete meal plan
 */
exports.deleteMealPlan = async (req, res) => {
  try {
    const { id } = req.params;
    const sellerId = req.user._id;

    const mealPlan = await MealPlan.findOne({ _id: id, createdBy: sellerId });
    if (!mealPlan) {
      return res.status(404).json({
        success: false,
        message: 'Meal plan not found or you do not have permission to delete it'
      });
    }

    // Check if meal plan has active subscriptions
    const activeSubscriptions = await Order.countDocuments({
      type: 'gkk',
      'items.name': { $regex: mealPlan.title, $options: 'i' },
      status: { $in: ['pending', 'confirmed', 'preparing'] }
    });

    if (activeSubscriptions > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete meal plan. It has ${activeSubscriptions} active orders.`
      });
    }

    // Set status to inactive instead of hard delete
    await MealPlan.findByIdAndUpdate(id, { 
      status: 'inactive',
      updatedAt: new Date()
    });

    res.json({
      success: true,
      message: 'Meal plan deleted successfully'
    });

  } catch (error) {
    console.error('Delete meal plan error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete meal plan',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Get single meal plan details
 */
exports.getMealPlan = async (req, res) => {
  try {
    const { id } = req.params;
    const sellerId = req.user._id;

    const mealPlan = await MealPlan.findOne({ _id: id, createdBy: sellerId });

    if (!mealPlan) {
      return res.status(404).json({
        success: false,
        message: 'Meal plan not found'
      });
    }

    // Get meal plan performance data
    const performance = await Order.aggregate([
      { 
        $match: { 
          type: 'gkk',
          'items.name': { $regex: mealPlan.title, $options: 'i' },
          status: { $in: ['delivered', 'confirmed'] }
        } 
      },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: '$totalAmount' }
        }
      }
    ]);

    const mealPlanWithPerformance = {
      ...mealPlan.toObject(),
      performance: performance[0] || {
        totalOrders: 0,
        totalRevenue: 0
      }
    };

    res.json({
      success: true,
      data: mealPlanWithPerformance
    });

  } catch (error) {
    console.error('Get meal plan error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch meal plan',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Get inventory alerts (low stock products)
 */
exports.getInventoryAlerts = async (req, res) => {
  try {
    const sellerId = req.user._id;

    const lowStockProducts = await Product.find({
      seller: sellerId,
      isActive: true,
      $expr: { $lte: ['$stock', '$lowStockThreshold'] }
    })
    .select('title stock lowStockThreshold images')
    .sort({ stock: 1 })
    .limit(20);

    const outOfStockProducts = await Product.find({
      seller: sellerId,
      isActive: true,
      stock: 0
    })
    .select('title stock images')
    .sort({ updatedAt: -1 })
    .limit(10);

    res.json({
      success: true,
      data: {
        lowStock: lowStockProducts.map(product => ({
          _id: product._id,
          name: product.title,
          stock: product.stock,
          threshold: product.lowStockThreshold || 10,
          image: product.images?.[0]?.url
        })),
        outOfStock: outOfStockProducts.map(product => ({
          _id: product._id,
          name: product.title,
          stock: product.stock,
          image: product.images?.[0]?.url
        })),
        summary: {
          lowStockCount: lowStockProducts.length,
          outOfStockCount: outOfStockProducts.length
        }
      }
    });

  } catch (error) {
    console.error('Get inventory alerts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch inventory alerts',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

