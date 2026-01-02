const mongoose = require('mongoose');
const DailyHisaab = require('../models/DailyHisaab');
const User = require('../models/User');
const Order = require('../models/Order');
const { AppError } = require('../utils/errors');
const catchAsync = require('../utils/catchAsync');

// Helper to get start and end of day
const getTodayRange = () => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

// @desc    Get hisaab by date range
// @route   GET /api/hisaab/range
// @access  Private/Seller
exports.getHisaabByDateRange = catchAsync(async (req, res, next) => {
  const { startDate, endDate } = req.query;
  
  if (!startDate || !endDate) {
    return next(new AppError('Please provide both start and end dates', 400));
  }
  
  // Parse dates with validation
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  // Validate dates
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return next(new AppError('Invalid date format. Please use YYYY-MM-DD format', 400));
  }
  
  // Set time to start and end of day
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);
  
  // Ensure end date is after or equal to start date
  if (start > end) {
    return next(new AppError('Start date must be before or equal to end date', 400));
  }
  
  const hisaabs = await DailyHisaab.find({
    date: { $gte: start, $lte: end },
    seller: req.user.id
  }).sort('date');
  
  // Calculate totals
  const totals = {
    totalSell: 0,
    totalTiffin: 0,
    totalOther: 0,
    totalCollected: 0,
    products: []
  };
  
  const productMap = new Map();
  
  hisaabs.forEach(hisaab => {
    hisaab.products.forEach(product => {
      // Update totals
      const productTotal = product.count * product.price;
      totals.totalSell += productTotal;
      totals.totalCollected += product.collectedPayment || 0;
      
      if (product.type === 'thali') {
        totals.totalTiffin += product.count;
      } else {
        totals.totalOther++;
      }
      
      // Group products by name and price
      const key = `${product.productName}_${product.price}`;
      if (!productMap.has(key)) {
        productMap.set(key, {
          productName: product.productName,
          price: product.price,
          count: 0,
          total: 0,
          collected: 0,
          type: product.type,
          unit: product.unit || 'pcs'
        });
      }
      
      const existing = productMap.get(key);
      existing.count += product.count;
      existing.total += productTotal;
      existing.collected += product.collectedPayment || 0;
    });
  });
  
  // Convert map to array
  totals.products = Array.from(productMap.values());
  
  res.status(200).json({
    status: 'success',
    data: {
      hisaabs,
      summary: totals,
      dateRange: { startDate: start, endDate: end }
    }
  });
});

// @desc    Get today's hisaab with delay information
// @desc    Get hisaab for a specific date or today's hisaab
// @route   GET /api/hisaab/today
// @access  Private/Seller
exports.getTodaysHisaab = catchAsync(async (req, res, next) => {
  const { date, sellerId } = req.query;
  const targetDate = date ? new Date(date) : new Date();
  
  // Set time range for the target date
  const start = new Date(targetDate);
  start.setHours(0, 0, 0, 0);
  const end = new Date(targetDate);
  end.setHours(23, 59, 59, 999);
  
  // Use provided sellerId or default to current user
  const seller = sellerId || req.user.id;
  
  // Find or create hisaab for the date and seller
  let hisaab = await DailyHisaab.findOne({
    date: { $gte: start, $lte: end },
    $or: [
      { seller: seller },
      { sellerId: seller }
    ]
  });

  if (!hisaab) {
    // Get seller info for new hisaab
    const sellerInfo = await User.findById(seller).select('name');
    if (!sellerInfo) {
      return next(new AppError('Seller not found', 404));
    }
    
    hisaab = await DailyHisaab.create({
      date: start,
      seller: seller,
      sellerName: sellerInfo.name,
      products: []
    });
  }
  
  res.status(200).json({
    status: 'success',
    data: response
  });
});

// @desc    Create or update today's hisaab
// @route   POST /api/hisaab/today
// @access  Private/Seller
exports.createOrUpdateHisaab = catchAsync(async (req, res, next) => {
  const { start, end } = getTodayRange();
  
  const hisaab = await DailyHisaab.findOneAndUpdate(
    { date: { $gte: start, $lte: end }, seller: req.user.id },
    { products: req.body.products },
    { new: true, runValidators: true, upsert: true }
  );

  res.status(200).json({
    status: 'success',
    data: hisaab
  });
});

// @desc    Add product to today's hisaab
// @route   POST /api/hisaab/today/products
// @access  Private/Seller
exports.addProduct = catchAsync(async (req, res, next) => {
  const { start, end } = getTodayRange();
  
  console.time('addProduct');
  console.log('Adding product with data:', req.body);
  
  try {
    // 1. Input validation
    const requiredFields = ['productName', 'type', 'count', 'price', 'unit'];
    const missingFields = requiredFields.filter(field => !req.body[field]);
    
    if (missingFields.length > 0) {
      console.error('Missing required fields:', missingFields);
      return next(new AppError(`Missing required fields: ${missingFields.join(', ')}`, 400));
    }

    // 2. Get seller info
    const seller = await User.findById(new mongoose.Types.ObjectId(req.body?.sellerId)).select('name');
    if (!seller) {
      return next(new AppError('Seller not found', 404));
    }

    // 3. Prepare product data as a plain JavaScript object
    const entryDate = req.body.entryDate ? new Date(req.body.entryDate) : new Date();
    
    const productData = {
      _id: new mongoose.Types.ObjectId(),
      productName: req.body.productName,
      type: req.body.type,
      count: Number(req.body.count),
      price: Number(req.body.price),
      unit: req.body.unit,
      sellsTo: Array.isArray(req.body.sellsTo) ? req.body.sellsTo : [],
      sellsBy: req.body?.sellerName || seller.name, // Use provided seller name or fallback to authenticated user
      sellerId: req.body?.sellerId || req.user.id, // Use provided seller ID or fallback to authenticated user
      subscriptionUser: req.body.type === 'subscription' ? req.body.subscriptionUser : null,
      collectedPayment: Number(req.body.collectedPayment) || 0,
      date: entryDate,
      createdAt: new Date()
    };
    
    // If this is a subscription type, ensure we have a subscription user
    if (req.body.type === 'subscription' && !req.body.subscriptionUser) {
      return next(new AppError('Subscription user is required for subscription type products', 400));
    }

    // 3. Create or update the daily hisaab
    // Find or create hisaab entry for the seller and date
    const sellerId = req.body?.sellerId || req.user.id;
    
    let hisaab = await DailyHisaab.findOne({
      date: { 
        $gte: new Date(entryDate.setHours(0, 0, 0, 0)),
        $lte: new Date(entryDate.setHours(23, 59, 59, 999))
      },
      seller: sellerId
    });

    if (!hisaab) {
      // Create new hisaab if it doesn't exist
      hisaab = new DailyHisaab({
        date: new Date(entryDate.setHours(0, 0, 0, 0)),
        seller: sellerId,
        sellerName: req.body?.sellerName || seller.name,
        products: [productData],
        createdAt: new Date()
      });
    } else {
      // Add product to existing hisaab
      hisaab.products.push(productData);
    }

    // Save the document
    await hisaab.save();

    if (!hisaab) {
      console.error('Failed to create/update hisaab entry');
      return next(new AppError('Failed to process your request', 500));
    }

    console.log('Product added successfully');
    console.timeEnd('addProduct');
    
    res.status(201).json({
      status: 'success',
      data: hisaab
    });
    
  } catch (error) {
    console.error('Error in addProduct:', {
      error: error.message,
      stack: error.stack,
      body: req.body,
      user: req.user?.id
    });
    
    // Handle duplicate key errors
    if (error.code === 11000) {
      return next(new AppError('This product already exists for today', 400));
    }
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return next(new AppError(`Validation error: ${messages.join('. ')}`, 400));
    }
    
    next(new AppError('Failed to add product. Please try again.', 500));
  }
});

// @desc    Update product in today's hisaab
// @route   PATCH /api/hisaab/today/products/:productId
// @access  Private/Seller
exports.updateProduct = catchAsync(async (req, res, next) => {
  const { start, end } = getTodayRange();
  const { productId } = req.params;
  
  const updateFields = {
    'products.$.count': req.body.count,
    'products.$.price': req.body.price,
    'products.$.type': req.body.type,
    'products.$.sellsTo': req.body.sellsTo,
    'products.$.date': new Date()
  };

  // Only update collectedPayment if it's provided
  if (req.body.collectedPayment !== undefined) {
    updateFields['products.$.collectedPayment'] = Number(req.body.collectedPayment);
  }

  const hisaab = await DailyHisaab.findOneAndUpdate(
    { 
      date: { $gte: start, $lte: end }, 
      seller: req.user.id,
      'products._id': productId 
    },
    { $set: updateFields },
    { new: true, runValidators: true }
  );

  if (!hisaab) {
    return next(new AppError('No hisaab found with that ID or product not found', 404));
  }

  res.status(200).json({
    status: 'success',
    data: hisaab
  });
});

// @desc    Delete product from today's hisaab
// @route   DELETE /api/hisaab/today/products/:productId
// @access  Private/Seller
exports.deleteProduct = catchAsync(async (req, res, next) => {
  const { start, end } = getTodayRange();
  const { productId } = req.params;
  
  const hisaab = await DailyHisaab.findOneAndUpdate(
    { 
      date: { $gte: start, $lte: end }, 
      seller: req.user.id 
    },
    { $pull: { products: { _id: productId } } },
    { new: true }
  );

  if (!hisaab) {
    return next(new AppError('No hisaab found with that ID', 404));
  }

  res.status(204).json({
    status: 'success',
    data: null
  });
});

// @desc    Get hisaab history
// @route   GET /api/hisaab/history
// @access  Private/Seller
exports.getHisaabHistory = catchAsync(async (req, res, next) => {
  const { startDate, endDate } = req.query;
  
  const query = { seller: req.user.id };
  
  if (startDate && endDate) {
    query.date = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }

  const hisaabs = await DailyHisaab.find(query).sort('-date');
  console.log("Hisaab history found:", hisaabs.length);

  // Process each hisaab to add grouped products and order info
  const processedHisaabs = await Promise.all(
    hisaabs.map(async (hisaab) => {
      const hisaabObj = hisaab.toObject();
      const dayStart = new Date(hisaab.date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(hisaab.date);
      dayEnd.setHours(23, 59, 59, 999);

      // Get orders for this day first to link with transactions
      const dayOrders = await Order.find({
        'items.seller': req.user.id,
        createdAt: { $gte: dayStart, $lte: dayEnd }
      })
      .select('_id orderNumber status isDelayed delayReason delayedAt preparationDeadline handoverDetails createdAt items')
      .populate('userId', 'name')
      .lean();

      // Create a time-based mapping of orders to product transactions
      const orderTimeMap = new Map();
      dayOrders.forEach(order => {
        const orderTime = new Date(order.createdAt);
        const timeKey = `${orderTime.getHours()}:${orderTime.getMinutes().toString().padStart(2, '0')}`;
        
        let delayFlag = null;
        let handoverFlag = null;

        // Delay flag
        if (order.isDelayed || (order.preparationDeadline && new Date() > new Date(order.preparationDeadline))) {
          delayFlag = {
            type: 'delayed',
            message: 'Order exceeded preparation time',
            delayMinutes: order.preparationDeadline ? 
              Math.floor((new Date() - new Date(order.preparationDeadline)) / (1000 * 60)) : 0
          };
        }

        // Handover flag
        if (order.handoverDetails?.restaurantMarkedReady && !order.handoverDetails?.deliveryPartnerPickup) {
          const waitTime = (new Date() - new Date(order.handoverDetails.restaurantMarkedReady.markedAt)) / (1000 * 60);
          if (waitTime > 10) {
            handoverFlag = {
              type: 'pending-pickup',
              message: 'Ready but not picked up',
              waitTime: Math.floor(waitTime)
            };
          }
        }

        if (!orderTimeMap.has(timeKey)) {
          orderTimeMap.set(timeKey, []);
        }
        orderTimeMap.get(timeKey).push({
          ...order,
          delayFlag,
          handoverFlag
        });
      });

      // Group products by name and price for this day
      let groupedProducts = [];
      if (hisaabObj.products) {
        const productMap = new Map();
        
        hisaabObj.products.forEach(product => {
          const key = `${product.productName}_${product.price}`;
          const transactionTime = new Date(product.date || product.createdAt || hisaab.date);
          const timeKey = `${transactionTime.getHours()}:${transactionTime.getMinutes().toString().padStart(2, '0')}`;
          
          // Find matching orders for this transaction time
          const matchingOrders = orderTimeMap.get(timeKey) || [];
          let transactionFlags = {
            delayFlag: null,
            handoverFlag: null
          };

          // Check if any order at this time has flags
          matchingOrders.forEach(order => {
            if (order.delayFlag) transactionFlags.delayFlag = order.delayFlag;
            if (order.handoverFlag) transactionFlags.handoverFlag = order.handoverFlag;
          });
          
          const transactionData = {
            count: product.count,
            time: product.date || product.createdAt || hisaab.date,
            sellsBy: product.sellsBy || product.sellerId,
            _id: product._id,
            ...transactionFlags
          };

          if (productMap.has(key)) {
            const existing = productMap.get(key);
            existing.totalCount += product.count;
            existing.totalAmount += (product.count * product.price);
            existing.transactions.push(transactionData);
          } else {
            productMap.set(key, {
              productName: product.productName,
              price: product.price,
              type: product.type,
              unit: product.unit || 'pcs',
              totalCount: product.count,
              totalAmount: (product.count * product.price),
              transactions: [transactionData]
            });
          }
        });
        
        groupedProducts = Array.from(productMap.values()).sort((a, b) => {
          if (a.type === 'tiffin' && b.type !== 'tiffin') return -1;
          if (b.type === 'tiffin' && a.type !== 'tiffin') return 1;
          return a.productName.localeCompare(b.productName);
        });
      }

      // Convert the orderTimeMap values back to a flat array for ordersInfo
      const ordersWithFlags = Array.from(orderTimeMap.values()).flat();

      return {
        ...hisaabObj,
        groupedProducts,
        ordersInfo: {
          totalOrders: ordersWithFlags.length,
          delayedOrders: ordersWithFlags.filter(o => o.delayFlag).length,
          flaggedHandovers: ordersWithFlags.filter(o => o.handoverFlag).length,
          orders: ordersWithFlags
        }
      };
    })
  );
  
  res.status(200).json({
    status: 'success',
    results: processedHisaabs.length,
    data: processedHisaabs
  });
});

// @desc    Get hisaab by date
// @route   GET /api/hisaab/:date
// @access  Private/Seller
exports.getHisaabByDate = catchAsync(async (req, res, next) => {
  const date = new Date(req.params.date);
  
  // Validate date
  if (isNaN(date.getTime())) {
    return next(new AppError('Invalid date format. Please use YYYY-MM-DD format', 400));
  }
  
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  
  const hisaab = await DailyHisaab.findOne({
    date: { $gte: start, $lte: end },
    seller: req.user.id
  });

  if (!hisaab) {
    return next(new AppError('No hisaab found for this date', 404));
  }

  res.status(200).json({
    status: 'success',
    data: hisaab
  });
});
