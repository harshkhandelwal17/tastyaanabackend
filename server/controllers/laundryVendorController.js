const mongoose = require('mongoose');
const LaundryVendor = require('../models/LaundryVendor');

// Helper function to find vendor by user (handles both _id and id)
const findVendorByUser = async (req) => {
  const userId = req.user._id || req.user.id;
  
  if (!userId) {
    console.log('❌ No userId found in request');
    return null;
  }

  console.log('🔍 findVendorByUser - Searching with userId:', userId.toString());
  console.log('🔍 findVendorByUser - req.user._id:', req.user._id?.toString());
  console.log('🔍 findVendorByUser - req.user.id:', req.user.id?.toString());
  console.log('🔍 findVendorByUser - req.user.email:', req.user.email);
  console.log('🔍 findVendorByUser - req.user.phone:', req.user.phone);

  // Convert userId to ObjectId if it's a string
  let userIdObj = userId;
  if (typeof userId === 'string' && mongoose.Types.ObjectId.isValid(userId)) {
    userIdObj = new mongoose.Types.ObjectId(userId);
  }

  // Try to find by createdBy with multiple formats
  let vendor = await LaundryVendor.findOne({ 
    $or: [
      { createdBy: userIdObj },
      { createdBy: userId },
      { createdBy: userId.toString() },
      { createdBy: req.user._id },
      { createdBy: req.user.id }
    ]
  });
  
  console.log('🔍 findVendorByUser - Vendor found by createdBy:', !!vendor);
  if (vendor) {
    console.log('✅ findVendorByUser - Vendor found:', vendor.name, 'createdBy:', vendor.createdBy?.toString());
  }
  
  // If not found, try by email/phone
  if (!vendor) {
    console.log('🔍 findVendorByUser - Trying email/phone search...');
    vendor = await LaundryVendor.findOne({ 
      $or: [
        { email: req.user.email },
        { phone: req.user.phone }
      ]
    });
    console.log('🔍 findVendorByUser - Vendor found by email/phone:', !!vendor);
    if (vendor) {
      console.log('✅ findVendorByUser - Vendor found by email/phone:', vendor.name, 'createdBy:', vendor.createdBy?.toString());
    }
  }
  
  // If still not found, log all vendors for debugging
  if (!vendor) {
    console.log('❌ findVendorByUser - Vendor not found. Checking all vendors...');
    const allVendors = await LaundryVendor.find({}).select('createdBy email phone name').limit(10);
    console.log('📋 All vendors in DB:', allVendors.map(v => ({
      id: v._id.toString(),
      createdBy: v.createdBy?.toString(),
      email: v.email,
      phone: v.phone,
      name: v.name
    })));
  }
  
  return vendor;
};

// @desc    Get all laundry vendors
// @route   GET /api/laundry/vendors
// @access  Public
exports.getVendors = async (req, res) => {
  try {
    const {
      pincode,
      services,
      rating,
      deliverySpeed, // 'quick' or 'scheduled'
      sortBy = 'rating'
    } = req.query;

    // Build query
    let query = { isActive: true };

    // Filter by pincode/service area
    if (pincode) {
      query.serviceAreas = pincode;
    }

    // Filter by services
    if (services) {
      const serviceArray = services.split(',');
      query.services = { $all: serviceArray };
    }

    // Filter by delivery speed
    if (deliverySpeed === 'quick') {
      query['quickServiceConfig.enabled'] = true;
    }

    // Filter by rating
    if (rating) {
      query.rating = { $gte: parseFloat(rating) };
    }

    // Sorting
    let sort = {};
    switch (sortBy) {
      case 'rating':
        sort = { rating: -1, totalOrders: -1 };
        break;
      case 'popular':
        sort = { totalOrders: -1 };
        break;
      case 'quick_orders':
        sort = { quickOrdersCompleted: -1 };
        break;
      default:
        sort = { rating: -1 };
    }

    const vendors = await LaundryVendor.find(query)
      .sort(sort)
      .select('-__v');

    res.status(200).json({
      success: true,
      count: vendors.length,
      data: vendors
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching vendors',
      error: error.message
    });
  }
};

// @desc    Get current user's vendor profile
// @route   GET /api/laundry/vendors/me
// @access  Private
exports.getMyVendor = async (req, res) => {
  try {
    // Get user ID - try both _id and id fields
    const userId = req.user._id || req.user.id;
    
    if (!userId) {
      console.log('❌ getMyVendor - No userId found');
      return res.status(400).json({
        success: false,
        message: 'User ID not found in request'
      });
    }

    console.log('🔍 getMyVendor - Searching for vendor');
    console.log('🔍 getMyVendor - userId:', userId.toString());
    console.log('🔍 getMyVendor - userId type:', typeof userId);
    console.log('🔍 getMyVendor - req.user._id:', req.user._id?.toString());
    console.log('🔍 getMyVendor - req.user.id:', req.user.id?.toString());
    console.log('🔍 getMyVendor - User email:', req.user.email);
    console.log('🔍 getMyVendor - User phone:', req.user.phone);

    // Use helper function to find vendor
    const vendor = await findVendorByUser(req);
    
    console.log('🔍 getMyVendor - Vendor found:', !!vendor);

    if (!vendor) {
      // Log for debugging - get all vendors and show their createdBy values
      console.log('❌ getMyVendor - Vendor not found. Checking database...');
      const allVendors = await LaundryVendor.find({}).select('createdBy email phone name').limit(10);
      console.log('📋 getMyVendor - All vendors in DB:');
      allVendors.forEach(v => {
        console.log('  - Vendor:', v.name);
        console.log('    ID:', v._id.toString());
        console.log('    createdBy:', v.createdBy?.toString(), '(type:', typeof v.createdBy, ')');
        console.log('    email:', v.email);
        console.log('    phone:', v.phone);
        console.log('    Match userId?', v.createdBy?.toString() === userId.toString());
        console.log('    Match _id?', v.createdBy?.toString() === req.user._id?.toString());
        console.log('    Match id?', v.createdBy?.toString() === req.user.id?.toString());
        console.log('    Match email?', v.email === req.user.email);
        console.log('    Match phone?', v.phone === req.user.phone);
        console.log('---');
      });
      
      return res.status(404).json({
        success: false,
        message: 'Vendor profile not found. Please create a vendor profile first.'
      });
    }

    console.log('✅ getMyVendor - Vendor found:', vendor.name, 'ID:', vendor._id.toString());

    res.status(200).json({
      success: true,
      data: vendor
    });

  } catch (error) {
    console.error('❌ getMyVendor - Error fetching vendor profile:', error);
    console.error('❌ getMyVendor - Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Error fetching vendor profile',
      error: error.message
    });
  }
};

// @desc    Get single vendor by ID or slug
// @route   GET /api/laundry/vendors/:id
// @access  Public
exports.getVendor = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if id is ObjectId or slug
    const query = id.match(/^[0-9a-fA-F]{24}$/) 
      ? { _id: id } 
      : { slug: id };

    const vendor = await LaundryVendor.findOne(query);

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    res.status(200).json({
      success: true,
      data: vendor
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching vendor',
      error: error.message
    });
  }
};

// @desc    Get vendor pricing
// @route   GET /api/laundry/vendors/:id/pricing
// @access  Public
exports.getVendorPricing = async (req, res) => {
  try {
    const { id } = req.params;
    const { deliverySpeed } = req.query; // 'quick' or 'scheduled'

    const vendor = await LaundryVendor.findById(id).select('name pricing deliverySpeed charges turnaround');

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    // Format pricing based on delivery speed
    const formattedPricing = vendor.pricing.map(item => {
      const services = item.services.map(service => ({
        service: service.service,
        price: deliverySpeed === 'quick' ? service.quickPrice : service.scheduledPrice
      }));

      return {
        item: item.item,
        category: item.category,
        services
      };
    });

    res.status(200).json({
      success: true,
      data: {
        vendorName: vendor.name,
        pricing: formattedPricing,
        charges: vendor.charges,
        turnaround: deliverySpeed === 'quick' ? vendor.turnaround.quick : vendor.turnaround.scheduled
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching pricing',
      error: error.message
    });
  }
};

// @desc    Get vendor subscription plans
// @route   GET /api/laundry/vendors/:id/plans
// @access  Public
exports.getVendorPlans = async (req, res) => {
  try {
    const { id } = req.params;

    const vendor = await LaundryVendor.findById(id).select('subscriptionPlans name');

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        vendorName: vendor.name,
        plans: vendor.subscriptionPlans.filter(plan => plan.isActive)
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching plans',
      error: error.message
    });
  }
};

// @desc    Check quick service availability
// @route   POST /api/laundry/vendors/check-quick-availability
// @access  Public
exports.checkQuickAvailability = async (req, res) => {
  try {
    const { pincode, requestedTime } = req.body;

    const currentTime = requestedTime ? new Date(requestedTime) : new Date();
    const currentHour = currentTime.getHours();
    const dayOfWeek = currentTime.toLocaleDateString('en-US', { weekday: 'lowercase' });

    // Find vendors with quick service enabled
    const vendors = await LaundryVendor.find({
      isActive: true,
      serviceAreas: pincode,
      'quickServiceConfig.enabled': true,
      'quickServiceConfig.availableDays': dayOfWeek
    }).select('name slug rating quickServiceConfig turnaround');

    // Filter by operating hours
    const availableVendors = vendors.filter(vendor => {
      const [startHour] = vendor.quickServiceConfig.operatingHours.start.split(':').map(Number);
      const [endHour] = vendor.quickServiceConfig.operatingHours.end.split(':').map(Number);
      
      return currentHour >= startHour && currentHour < endHour;
    });

    res.status(200).json({
      success: true,
      available: availableVendors.length > 0,
      count: availableVendors.length,
      data: availableVendors,
      estimatedPickup: availableVendors.length > 0 
        ? `Within ${availableVendors[0].turnaround.quick.max} hours`
        : null
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error checking availability',
      error: error.message
    });
  }
};

// @desc    Check scheduled service availability
// @route   POST /api/laundry/vendors/check-scheduled-availability
// @access  Public
exports.checkScheduledAvailability = async (req, res) => {
  try {
    const { pincode, date, timeSlot } = req.body;

    // Find vendors serving this pincode
    const vendors = await LaundryVendor.find({
      isActive: true,
      serviceAreas: pincode
    }).select('name slug rating scheduledSlots turnaround');

    // Check slot availability
    const availableVendors = vendors.filter(vendor => {
      const daySlot = vendor.scheduledSlots.find(slot => 
        new Date(slot.date).toDateString() === new Date(date).toDateString()
      );

      if (!daySlot) return true; // No booking data means available

      const slotData = daySlot.slots.find(s => s.timeSlot === timeSlot);
      
      if (!slotData) return true;
      
      return slotData.available && slotData.currentBookings < slotData.maxCapacity;
    });

    res.status(200).json({
      success: true,
      available: availableVendors.length > 0,
      count: availableVendors.length,
      data: availableVendors
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error checking availability',
      error: error.message
    });
  }
};

// @desc    Unified availability check (quick or scheduled)
// @route   POST /api/laundry/vendors/check-availability
// @access  Public
exports.checkAvailability = async (req, res) => {
  try {
    const mode = (req.body.deliverySpeed || req.body.type || '').toLowerCase();
    if (mode === 'quick') {
      return exports.checkQuickAvailability(req, res);
    }
    // Default to scheduled if not explicitly quick
    return exports.checkScheduledAvailability(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error checking availability',
      error: error.message
    });
  }
};
// @desc    Get nearby vendors (geolocation)
// @route   GET /api/laundry/vendors/nearby
// @access  Public
exports.getNearbyVendors = async (req, res) => {
  try {
    const { latitude, longitude, radius = 10, deliverySpeed } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required'
      });
    }

    const query = {
      isActive: true,
      'address.coordinates': {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(longitude), parseFloat(latitude)]
          },
          $maxDistance: radius * 1000 // Convert km to meters
        }
      }
    };

    // Filter by delivery speed if specified
    if (deliverySpeed === 'quick') {
      query['quickServiceConfig.enabled'] = true;
    }

    const vendors = await LaundryVendor.find(query)
      .select('name slug rating address pricing quickServiceConfig turnaround');

    res.status(200).json({
      success: true,
      count: vendors.length,
      data: vendors
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching nearby vendors',
      error: error.message
    });
  }
};

// @desc    Create vendor (Admin or Seller can create their own)
// @route   POST /api/laundry/vendors
// @access  Private
exports.createVendor = async (req, res) => {
  try {
    // Get user ID - try both _id and id fields
    const userId = req.user._id || req.user.id;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID not found in request'
      });
    }

    // Check if user already has a vendor profile
    const existingVendor = await LaundryVendor.findOne({ 
      $or: [
        { createdBy: userId },
        { createdBy: userId.toString() },
        { createdBy: req.user._id },
        { createdBy: req.user.id }
      ]
    });
    if (existingVendor) {
      return res.status(400).json({
        success: false,
        message: 'You already have a vendor profile',
        data: existingVendor
      });
    }

    // Also check by email/phone
    const existingByContact = await LaundryVendor.findOne({
      $or: [
        { email: req.user.email },
        { phone: req.user.phone }
      ]
    });
    if (existingByContact) {
      return res.status(400).json({
        success: false,
        message: 'A vendor profile already exists with your email or phone',
        data: existingByContact
      });
    }

    console.log('📝 Creating vendor for userId:', userId.toString());

    // Prepare vendor data
    const vendorData = {
      ...req.body,
      createdBy: userId, // Link to current user
      // Use user's email/phone if not provided
      email: req.body.email || req.user.email,
      phone: req.body.phone || req.user.phone
    };

    // Set default values if not provided
    if (!vendorData.services || vendorData.services.length === 0) {
      vendorData.services = ['wash_fold', 'wash_iron'];
    }
    if (!vendorData.serviceAreas || vendorData.serviceAreas.length === 0) {
      vendorData.serviceAreas = vendorData.address?.pincode ? [vendorData.address.pincode] : [];
    }
    if (!vendorData.pricingConfig) {
      vendorData.pricingConfig = {
        model: 'per_piece',
        minWeight: 1
      };
    }

    // Handle coordinates - only set if provided, otherwise remove to avoid geospatial index error
    if (vendorData.address && vendorData.address.coordinates) {
      // If coordinates are provided, ensure they're in the correct format
      if (!vendorData.address.coordinates.coordinates || 
          !Array.isArray(vendorData.address.coordinates.coordinates) ||
          vendorData.address.coordinates.coordinates.length !== 2) {
        // Invalid coordinates format, remove it
        delete vendorData.address.coordinates;
      }
    } else {
      // No coordinates provided, remove the field entirely
      if (vendorData.address) {
        delete vendorData.address.coordinates;
      }
    }

    const vendor = await LaundryVendor.create(vendorData);

    console.log('✅ Vendor created successfully:', {
      vendorId: vendor._id.toString(),
      vendorName: vendor.name,
      createdBy: vendor.createdBy?.toString(),
      createdByType: typeof vendor.createdBy,
      email: vendor.email,
      phone: vendor.phone
    });
    
    // Verify the vendor was saved correctly
    const verifyVendor = await LaundryVendor.findById(vendor._id);
    console.log('✅ Verification - Vendor in DB:', {
      id: verifyVendor._id.toString(),
      createdBy: verifyVendor.createdBy?.toString(),
      createdByType: typeof verifyVendor.createdBy
    });

    res.status(201).json({
      success: true,
      message: 'Vendor profile created successfully',
      data: vendor
    });

  } catch (error) {
    console.error('Error creating vendor profile:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = {};
      Object.keys(error.errors).forEach(key => {
        validationErrors[key] = error.errors[key].message;
      });
      
      return res.status(400).json({
        success: false,
        message: 'Validation error. Please check your input.',
        error: error.message,
        errors: validationErrors
      });
    }
    
    // Handle duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        success: false,
        message: `A vendor with this ${field} already exists.`,
        error: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error creating vendor profile',
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// @desc    Update vendor
// @route   PUT /api/laundry/vendors/:id
// @access  Private/Admin
exports.updateVendor = async (req, res) => {
  try {
    const vendor = await LaundryVendor.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Vendor updated successfully',
      data: vendor
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating vendor',
      error: error.message
    });
  }
};

// @desc    Delete vendor (soft delete)
// @route   DELETE /api/laundry/vendors/:id
// @access  Private/Admin
exports.deleteVendor = async (req, res) => {
  try {
    const vendor = await LaundryVendor.findById(req.params.id);

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    vendor.isActive = false;
    await vendor.save();

    res.status(200).json({
      success: true,
      message: 'Vendor deactivated successfully'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting vendor',
      error: error.message
    });
  }
};

// @desc    Update vendor pricing
// @route   PATCH /api/laundry/vendors/:id/pricing
// @access  Private/Admin
exports.updatePricing = async (req, res) => {
  try {
    const { pricing, pricingConfig, charges, quickPricing, quickWeightBasedPricing } = req.body;
    
    console.log('🔧 updatePricing - Request params:', req.params);
    console.log('🔧 updatePricing - Request URL:', req.url);
    console.log('🔧 updatePricing - Request path:', req.path);
    console.log('🔧 updatePricing - User ID:', req.user._id?.toString() || req.user.id?.toString());
    console.log('🔧 updatePricing - User email:', req.user.email);
    
    let vendor;
    
    // Check if route is /vendors/me/pricing
    // For literal routes like /vendors/me/pricing, req.params.id will be undefined
    // For parameterized routes like /vendors/:id/pricing, req.params.id will be 'me'
    // Check both path and params to handle both cases
    const pathIncludesMe = req.path && req.path.includes('/vendors/me/');
    const urlIncludesMe = req.url && req.url.includes('/vendors/me/');
    const paramsIdIsMe = req.params.id === 'me';
    
    const isMeRoute = paramsIdIsMe || pathIncludesMe || urlIncludesMe;
    
    console.log('🔧 updatePricing - Route detection:', {
      isMeRoute,
      pathIncludesMe,
      urlIncludesMe,
      paramsIdIsMe,
      path: req.path,
      url: req.url,
      params: req.params
    });
    
    if (isMeRoute) {
      console.log('🔧 updatePricing - Finding vendor by user (me route)');
      vendor = await findVendorByUser(req);
      console.log('🔧 updatePricing - Vendor found:', !!vendor);
      if (vendor) {
        console.log('✅ updatePricing - Vendor details:', {
          id: vendor._id.toString(),
          name: vendor.name,
          createdBy: vendor.createdBy?.toString()
        });
      }
    } else {
      console.log('🔧 updatePricing - Finding vendor by ID:', req.params.id);
      vendor = await LaundryVendor.findById(req.params.id);
      console.log('🔧 updatePricing - Vendor found:', !!vendor);
    }

    if (!vendor) {
      console.log('❌ updatePricing - Vendor not found');
      // Log for debugging
      const userId = req.user._id || req.user.id;
      const allVendors = await LaundryVendor.find({}).select('createdBy email phone name').limit(5);
      console.log('📋 updatePricing - Sample vendors:', allVendors.map(v => ({
        id: v._id.toString(),
        createdBy: v.createdBy?.toString(),
        email: v.email,
        name: v.name
      })));
      
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }
    
    console.log('✅ updatePricing - Vendor found:', vendor.name);
    
    // Verify ownership if not admin
    const userId = req.user._id || req.user.id;
    const vendorCreatedBy = vendor.createdBy?.toString();
    const userIdentifier = userId?.toString() || req.user._id?.toString() || req.user.id?.toString();
    
    if (req.user.role !== 'admin' && vendorCreatedBy && userIdentifier && vendorCreatedBy !== userIdentifier) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this vendor'
      });
    }

    console.log('🔧 updatePricing - Updating pricing data...');
    console.log('🔧 updatePricing - Request body keys:', Object.keys(req.body));
    
    // Deep merge helper function - preserves structure, only updates provided values
    const deepMerge = (target, source) => {
      if (!source || typeof source !== 'object') return target || {};
      const result = target ? { ...target } : {};
      
      Object.keys(source).forEach(key => {
        const value = source[key];
        
        // Skip undefined and null values - don't overwrite existing values
        if (value === undefined || value === null) {
          return; // Keep existing value in result
        }
        
        // If it's an object (not array), deep merge it
        if (value && typeof value === 'object' && !Array.isArray(value) && value.constructor === Object) {
          // If target has this key and it's also an object, merge recursively
          if (result[key] && typeof result[key] === 'object' && !Array.isArray(result[key])) {
            result[key] = deepMerge(result[key], value);
          } else {
            // If target doesn't have this key or it's not an object, set it
            result[key] = { ...value };
          }
        } else {
          // For primitive values, set them
          result[key] = value;
        }
      });
      
      return result;
    };
    
    // Clean undefined values from nested objects - recursively removes all undefined
    const cleanUndefined = (obj) => {
      if (obj === undefined || obj === null) return undefined;
      if (typeof obj !== 'object' || Array.isArray(obj)) return obj;
      
      const cleaned = {};
      let hasValidKeys = false;
      
      Object.keys(obj).forEach(key => {
        const value = obj[key];
        
        // Skip undefined and null values completely
        if (value === undefined || value === null) {
          return;
        }
        
        // Recursively clean nested objects
        if (value && typeof value === 'object' && !Array.isArray(value) && value.constructor === Object) {
          const cleanedNested = cleanUndefined(value);
          // Only add if cleaned nested object has valid keys
          if (cleanedNested && typeof cleanedNested === 'object' && Object.keys(cleanedNested).length > 0) {
            cleaned[key] = cleanedNested;
            hasValidKeys = true;
          }
        } else {
          // For primitive values, add them
          cleaned[key] = value;
          hasValidKeys = true;
        }
      });
      
      // Return undefined if no valid keys, otherwise return cleaned object
      return hasValidKeys ? cleaned : undefined;
    };
    
    if (pricing && typeof pricing === 'object') {
      console.log('🔧 updatePricing - Merging pricing:', Object.keys(pricing).length, 'items');
      console.log('🔧 updatePricing - pricing before clean:', JSON.stringify(pricing, null, 2));
      
      // Clean undefined values from nested service types, but preserve item type structure
      // Convert undefined/null to 0, keep 0 and other valid numbers
      const cleanedPricing = {};
      Object.keys(pricing).forEach(itemType => {
        const itemPricing = pricing[itemType];
        if (itemPricing && typeof itemPricing === 'object' && !Array.isArray(itemPricing)) {
          // Clean service types within this item type
          const cleanedItemPricing = {};
          Object.keys(itemPricing).forEach(serviceType => {
            const servicePrice = itemPricing[serviceType];
            // Accept 0 as valid, convert undefined/null to 0
            if (servicePrice === undefined || servicePrice === null || servicePrice === '') {
              cleanedItemPricing[serviceType] = 0;
            } else {
              cleanedItemPricing[serviceType] = servicePrice;
            }
          });
          // Only add item type if it has at least one service type
          if (Object.keys(cleanedItemPricing).length > 0) {
            cleanedPricing[itemType] = cleanedItemPricing;
          }
        }
      });
      
      console.log('🔧 updatePricing - pricing after clean:', JSON.stringify(cleanedPricing, null, 2));
      
      // Merge with existing pricing, preserving existing item types
      const existingPricing = vendor.pricing || {};
      vendor.pricing = deepMerge(existingPricing, cleanedPricing);
      
      // Final cleanup - convert undefined to 0, keep 0 and other valid values
      Object.keys(vendor.pricing).forEach(itemType => {
        if (vendor.pricing[itemType] && typeof vendor.pricing[itemType] === 'object') {
          Object.keys(vendor.pricing[itemType]).forEach(serviceType => {
            // Convert undefined/null to 0, keep 0 and other valid numbers
            if (vendor.pricing[itemType][serviceType] === undefined || vendor.pricing[itemType][serviceType] === null) {
              vendor.pricing[itemType][serviceType] = 0;
            }
          });
          // Remove empty item type objects (shouldn't happen now, but safety check)
          if (Object.keys(vendor.pricing[itemType]).length === 0) {
            delete vendor.pricing[itemType];
          }
        } else if (vendor.pricing[itemType] === undefined) {
          delete vendor.pricing[itemType];
        }
      });
      
      console.log('🔧 updatePricing - pricing final:', JSON.stringify(vendor.pricing, null, 2));
      vendor.markModified('pricing');
    }

    // Update quick service pricing if provided and has values
    // If quickPricing is not sent in request, we don't update it (vendor can skip it)
    if (req.body.quickPricing !== undefined && req.body.quickPricing !== null) {
      if (typeof req.body.quickPricing === 'object' && Object.keys(req.body.quickPricing).length > 0) {
        console.log('🔧 updatePricing - Merging quickPricing:', Object.keys(req.body.quickPricing).length, 'items');
        console.log('🔧 updatePricing - quickPricing before clean:', JSON.stringify(req.body.quickPricing, null, 2));
        
        // Clean undefined values from nested service types, but preserve item type structure
        // Convert undefined/null to 0, keep 0 and other valid numbers
        const cleanedQuickPricing = {};
        Object.keys(req.body.quickPricing).forEach(itemType => {
          const itemPricing = req.body.quickPricing[itemType];
          if (itemPricing && typeof itemPricing === 'object' && !Array.isArray(itemPricing)) {
            // Clean service types within this item type
            const cleanedItemPricing = {};
            Object.keys(itemPricing).forEach(serviceType => {
              const servicePrice = itemPricing[serviceType];
              // Accept 0 as valid, convert undefined/null to 0
              if (servicePrice === undefined || servicePrice === null || servicePrice === '') {
                cleanedItemPricing[serviceType] = 0;
              } else {
                cleanedItemPricing[serviceType] = servicePrice;
              }
            });
            // Only add item type if it has at least one service type
            if (Object.keys(cleanedItemPricing).length > 0) {
              cleanedQuickPricing[itemType] = cleanedItemPricing;
            }
          }
        });
        
        console.log('🔧 updatePricing - quickPricing after clean:', JSON.stringify(cleanedQuickPricing, null, 2));
        
        // Only merge if there are actual values to merge
        if (Object.keys(cleanedQuickPricing).length > 0) {
          const existingQuickPricing = vendor.quickPricing || {};
          vendor.quickPricing = deepMerge(existingQuickPricing, cleanedQuickPricing);
          
          // Final cleanup - convert undefined to 0, keep 0 and other valid values
          Object.keys(vendor.quickPricing).forEach(itemType => {
            if (vendor.quickPricing[itemType] && typeof vendor.quickPricing[itemType] === 'object') {
              Object.keys(vendor.quickPricing[itemType]).forEach(serviceType => {
                // Convert undefined/null to 0, keep 0 and other valid numbers
                if (vendor.quickPricing[itemType][serviceType] === undefined || vendor.quickPricing[itemType][serviceType] === null) {
                  vendor.quickPricing[itemType][serviceType] = 0;
                }
              });
              // Remove empty item type objects (shouldn't happen now, but safety check)
              if (Object.keys(vendor.quickPricing[itemType]).length === 0) {
                delete vendor.quickPricing[itemType];
              }
            } else if (vendor.quickPricing[itemType] === undefined) {
              delete vendor.quickPricing[itemType];
            }
          });
          
          console.log('🔧 updatePricing - quickPricing final:', JSON.stringify(vendor.quickPricing, null, 2));
          vendor.markModified('quickPricing');
        } else {
          // If cleaned object is empty, don't update quickPricing at all
          console.log('🔧 updatePricing - quickPricing is empty after cleaning, skipping update');
        }
      } else {
        // Empty object or null - vendor doesn't want to set quick pricing, skip it
        console.log('🔧 updatePricing - quickPricing is empty/null, skipping update (vendor can skip quick pricing)');
      }
    } else {
      // quickPricing not sent in request - vendor didn't update it, keep existing
      console.log('🔧 updatePricing - quickPricing not in request, keeping existing values');
    }

    if (pricingConfig && typeof pricingConfig === 'object') {
      console.log('🔧 updatePricing - Updating pricingConfig:', pricingConfig);
      // Deep merge pricingConfig
      vendor.pricingConfig = deepMerge(vendor.pricingConfig || {}, pricingConfig);
      
      // Update quick weight-based pricing if provided and has values
      // If quickWeightBasedPricing is not sent, we don't update it (vendor can skip it)
      if (req.body.quickWeightBasedPricing !== undefined && req.body.quickWeightBasedPricing !== null) {
        if (typeof req.body.quickWeightBasedPricing === 'object' && Object.keys(req.body.quickWeightBasedPricing).length > 0) {
          console.log('🔧 updatePricing - Merging quickWeightBasedPricing:', Object.keys(req.body.quickWeightBasedPricing).length, 'items');
          vendor.quickWeightBasedPricing = deepMerge(
            vendor.quickWeightBasedPricing || {}, 
            req.body.quickWeightBasedPricing
          );
          vendor.markModified('quickWeightBasedPricing');
        } else {
          console.log('🔧 updatePricing - quickWeightBasedPricing is empty/null, skipping update (vendor can skip it)');
        }
      } else {
        console.log('🔧 updatePricing - quickWeightBasedPricing not in request, keeping existing values');
      }
      
      vendor.markModified('pricingConfig');
    }

    if (charges && typeof charges === 'object') {
      console.log('🔧 updatePricing - Updating charges:', charges);
      vendor.charges = deepMerge(vendor.charges || {}, charges);
      vendor.markModified('charges');
    }

    // Final safety check - ensure no undefined values in pricing objects
    // Convert undefined/null to 0, keep 0 and other valid numbers
    const finalCleanPricing = (pricingObj) => {
      if (!pricingObj || typeof pricingObj !== 'object') return pricingObj;
      const cleaned = {};
      Object.keys(pricingObj).forEach(itemType => {
        const itemPricing = pricingObj[itemType];
        // Skip if item type is undefined or null
        if (itemPricing === undefined || itemPricing === null) {
          return;
        }
        // If it's an object, clean service types
        if (itemPricing && typeof itemPricing === 'object' && !Array.isArray(itemPricing)) {
          const cleanedItemPricing = {};
          Object.keys(itemPricing).forEach(serviceType => {
            const servicePrice = itemPricing[serviceType];
            // Accept 0 as valid, convert undefined/null to 0
            if (servicePrice === undefined || servicePrice === null || servicePrice === '') {
              cleanedItemPricing[serviceType] = 0;
            } else {
              cleanedItemPricing[serviceType] = servicePrice;
            }
          });
          // Only add if it has service types
          if (Object.keys(cleanedItemPricing).length > 0) {
            cleaned[itemType] = cleanedItemPricing;
          }
        }
      });
      return cleaned;
    };
    
    // Final cleanup of pricing objects
    if (vendor.pricing) {
      vendor.pricing = finalCleanPricing(vendor.pricing);
    }
    if (vendor.quickPricing) {
      vendor.quickPricing = finalCleanPricing(vendor.quickPricing);
    }
    
    // Validate pricing values before saving
    console.log('🔧 updatePricing - Validating pricing values...');
    
    // Validate pricing values are within reasonable limits
    if (vendor.pricing && typeof vendor.pricing === 'object') {
      Object.keys(vendor.pricing).forEach(itemType => {
        if (vendor.pricing[itemType] && typeof vendor.pricing[itemType] === 'object') {
          Object.keys(vendor.pricing[itemType]).forEach(serviceType => {
            const price = vendor.pricing[itemType][serviceType];
            if (typeof price === 'number' && (price < 0 || price > 10000)) {
              throw new Error(`Price for ${itemType} - ${serviceType} must be between 0 and 10000`);
            }
          });
        }
      });
    }

    if (vendor.quickPricing && typeof vendor.quickPricing === 'object') {
      Object.keys(vendor.quickPricing).forEach(itemType => {
        if (vendor.quickPricing[itemType] && typeof vendor.quickPricing[itemType] === 'object') {
          Object.keys(vendor.quickPricing[itemType]).forEach(serviceType => {
            const price = vendor.quickPricing[itemType][serviceType];
            if (typeof price === 'number' && (price < 0 || price > 10000)) {
              throw new Error(`Quick price for ${itemType} - ${serviceType} must be between 0 and 10000`);
            }
          });
        }
      });
    }

    if (vendor.pricingConfig?.weightBasedPricing && typeof vendor.pricingConfig.weightBasedPricing === 'object') {
      Object.keys(vendor.pricingConfig.weightBasedPricing).forEach(serviceType => {
        const price = vendor.pricingConfig.weightBasedPricing[serviceType];
        if (typeof price === 'number' && (price < 0 || price > 1000)) {
          throw new Error(`Weight-based price for ${serviceType} must be between 0 and 1000 per kg`);
        }
      });
    }

    if (vendor.quickWeightBasedPricing && typeof vendor.quickWeightBasedPricing === 'object') {
      Object.keys(vendor.quickWeightBasedPricing).forEach(serviceType => {
        const price = vendor.quickWeightBasedPricing[serviceType];
        if (typeof price === 'number' && (price < 0 || price > 1000)) {
          throw new Error(`Quick weight-based price for ${serviceType} must be between 0 and 1000 per kg`);
        }
      });
    }

    // Validate charges
    if (vendor.charges) {
      Object.keys(vendor.charges).forEach(serviceType => {
        const charge = vendor.charges[serviceType];
        if (charge && typeof charge === 'object') {
          if (charge.surcharge && (charge.surcharge < 0 || charge.surcharge > 100)) {
            throw new Error(`Surcharge for ${serviceType} must be between 0 and 100 percent`);
          }
          if (charge.pickup && (charge.pickup < 0 || charge.pickup > 10000)) {
            throw new Error(`Pickup charge for ${serviceType} must be between 0 and 10000`);
          }
          if (charge.delivery && (charge.delivery < 0 || charge.delivery > 10000)) {
            throw new Error(`Delivery charge for ${serviceType} must be between 0 and 10000`);
          }
        }
      });
    }

    // Validate before saving
    console.log('🔧 updatePricing - Validating vendor before save...');
    const validationError = vendor.validateSync();
    if (validationError) {
      console.error('❌ updatePricing - Validation error before save:', validationError);
      throw validationError;
    }

    console.log('🔧 updatePricing - Saving vendor...');
    await vendor.save();
    console.log('✅ updatePricing - Vendor saved successfully');

    res.status(200).json({
      success: true,
      message: 'Pricing updated successfully',
      data: {
        pricing: vendor.pricing,
        pricingConfig: vendor.pricingConfig,
        charges: vendor.charges
      }
    });

  } catch (error) {
    console.error('❌ updatePricing - Error:', error);
    console.error('❌ updatePricing - Error stack:', error.stack);
    console.error('❌ updatePricing - Error name:', error.name);
    console.error('❌ updatePricing - Full error object:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = {};
      Object.keys(error.errors || {}).forEach(key => {
        validationErrors[key] = error.errors[key].message;
        console.error(`❌ Validation error - ${key}:`, error.errors[key].message);
      });
      
      console.error('❌ Validation errors object:', validationErrors);
      
      return res.status(400).json({
        success: false,
        message: 'Validation error. Please check your input.',
        error: error.message,
        errors: validationErrors
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error updating pricing',
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// @desc    Update vendor services
// @route   PATCH /api/laundry/vendors/:id/services
// @access  Private/Admin
exports.updateServices = async (req, res) => {
  try {
    const { services, specializations } = req.body;
    let vendor;
    
    // If id is 'me', get current user's vendor
    if (req.params.id === 'me') {
      vendor = await findVendorByUser(req);
    } else {
      vendor = await LaundryVendor.findById(req.params.id);
    }

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }
    
    // Verify ownership if not admin
    const userId = req.user._id || req.user.id;
    const vendorCreatedBy = vendor.createdBy?.toString();
    const userIdentifier = userId?.toString() || req.user._id?.toString() || req.user.id?.toString();
    
    if (req.user.role !== 'admin' && vendorCreatedBy && userIdentifier && vendorCreatedBy !== userIdentifier) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this vendor'
      });
    }

    if (services) {
      vendor.services = services;
    }

    if (specializations) {
      vendor.specializations = specializations;
    }

    await vendor.save();

    res.status(200).json({
      success: true,
      message: 'Services updated successfully',
      data: {
        services: vendor.services,
        specializations: vendor.specializations
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating services',
      error: error.message
    });
  }
};

// @desc    Update quick service configuration
// @route   PATCH /api/laundry/vendors/:id/quick-service or /api/laundry/vendors/me/quick-service
// @access  Private/Admin
exports.updateQuickServiceConfig = async (req, res) => {
  try {
    let vendor;
    
    // Check if route is /vendors/me/quick-service (no id param) or /vendors/:id/quick-service with id='me'
    const vendorId = req.params.id;
    const isMeRoute = !vendorId || vendorId === 'me' || req.path.includes('/vendors/me/');
    
    if (isMeRoute) {
      // Get current user's vendor
      vendor = await findVendorByUser(req);
    } else {
      vendor = await LaundryVendor.findById(vendorId);
    }

    if (!vendor) {
      console.log('❌ updateQuickServiceConfig - Vendor not found');
      console.log('❌ updateQuickServiceConfig - vendorId:', vendorId);
      console.log('❌ updateQuickServiceConfig - isMeRoute:', isMeRoute);
      console.log('❌ updateQuickServiceConfig - req.user._id:', req.user._id?.toString());
      console.log('❌ updateQuickServiceConfig - req.path:', req.path);
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }
    
    console.log('✅ updateQuickServiceConfig - Vendor found:', vendor.name, 'ID:', vendor._id.toString());
    
    // Verify ownership if not admin
    const userId = req.user._id || req.user.id;
    const vendorCreatedBy = vendor.createdBy?.toString();
    const userIdentifier = userId?.toString() || req.user._id?.toString() || req.user.id?.toString();
    
    if (req.user.role !== 'admin' && vendorCreatedBy && userIdentifier && vendorCreatedBy !== userIdentifier) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this vendor'
      });
    }

    vendor.quickServiceConfig = {
      ...vendor.quickServiceConfig,
      ...req.body
    };

    await vendor.save();

    res.status(200).json({
      success: true,
      message: 'Quick service configuration updated successfully',
      data: vendor.quickServiceConfig
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating quick service configuration',
      error: error.message
    });
  }
};

// @desc    Update scheduled service configuration
// @route   PATCH /api/laundry/vendors/:id/scheduled-service
// @access  Private/Admin
exports.updateScheduledServiceConfig = async (req, res) => {
  try {
    let vendor;
    
    // If id is 'me', get current user's vendor
    if (req.params.id === 'me') {
      vendor = await findVendorByUser(req);
    } else {
      vendor = await LaundryVendor.findById(req.params.id);
    }

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }
    
    // Verify ownership if not admin
    const userId = req.user._id || req.user.id;
    const vendorCreatedBy = vendor.createdBy?.toString();
    const userIdentifier = userId?.toString() || req.user._id?.toString() || req.user.id?.toString();
    
    if (req.user.role !== 'admin' && vendorCreatedBy && userIdentifier && vendorCreatedBy !== userIdentifier) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this vendor'
      });
    }

    vendor.scheduledServiceConfig = {
      ...vendor.scheduledServiceConfig,
      ...req.body
    };

    await vendor.save();

    res.status(200).json({
      success: true,
      message: 'Scheduled service configuration updated successfully',
      data: vendor.scheduledServiceConfig
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating scheduled service configuration',
      error: error.message
    });
  }
};

// @desc    Add or update subscription plan
// @route   POST /api/laundry/vendors/:id/plans
// @access  Private
exports.addOrUpdatePlan = async (req, res) => {
  try {
    let vendor;
    
    // Check if this is the /me route (either via params or path)
    // Route can be /vendors/me/plans (hardcoded) or /vendors/:id/plans (parameterized)
    const isMeRoute = req.params.id === 'me' || 
                      (req.params.id === undefined && req.path && req.path.includes('/vendors/me/')) ||
                      (req.originalUrl && req.originalUrl.includes('/vendors/me/'));
    
    console.log('🔍 addOrUpdatePlan - Route check:', {
      'req.params.id': req.params.id,
      'req.path': req.path,
      'req.originalUrl': req.originalUrl,
      'isMeRoute': isMeRoute,
      'userId': req.user._id?.toString()
    });
    
    // If id is 'me' or route is /vendors/me/plans, get current user's vendor
    if (isMeRoute) {
      vendor = await findVendorByUser(req);
      if (!vendor) {
        console.log('❌ addOrUpdatePlan - Vendor not found for user:', req.user._id?.toString());
        return res.status(404).json({
          success: false,
          message: 'Vendor profile not found. Please create a vendor profile first.'
        });
      }
      console.log('✅ addOrUpdatePlan - Vendor found:', vendor.name, 'ID:', vendor._id.toString());
    } else {
      vendor = await LaundryVendor.findById(req.params.id);
    }

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }
    
    // Verify ownership if not admin
    const userId = req.user._id || req.user.id;
    const vendorCreatedBy = vendor.createdBy?.toString();
    const userIdentifier = userId?.toString() || req.user._id?.toString() || req.user.id?.toString();
    
    if (req.user.role !== 'admin' && vendorCreatedBy && userIdentifier && vendorCreatedBy !== userIdentifier) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this vendor'
      });
    }

    const { planId, ...planData } = req.body;
    
    // If planId provided, update existing plan
    if (planId) {
      const planIndex = vendor.subscriptionPlans.findIndex(p => p.id === planId);
      if (planIndex === -1) {
        return res.status(404).json({
          success: false,
          message: 'Plan not found'
        });
      }
      vendor.subscriptionPlans[planIndex] = { ...vendor.subscriptionPlans[planIndex].toObject(), ...planData };
    } else {
      // Add new plan
      const newPlanId = `plan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      vendor.subscriptionPlans.push({ id: newPlanId, ...planData });
    }

    await vendor.save();

    res.status(200).json({
      success: true,
      message: planId ? 'Plan updated successfully' : 'Plan added successfully',
      data: vendor.subscriptionPlans
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error saving plan',
      error: error.message
    });
  }
};

// @desc    Delete subscription plan
// @route   DELETE /api/laundry/vendors/:id/plans/:planId
// @access  Private
exports.deletePlan = async (req, res) => {
  try {
    let vendor;
    
    // Check if this is the /me route (either via params or path)
    // Route can be /vendors/me/plans/:planId (hardcoded) or /vendors/:id/plans/:planId (parameterized)
    const isMeRoute = req.params.id === 'me' || 
                      (req.params.id === undefined && req.path && req.path.includes('/vendors/me/')) ||
                      (req.originalUrl && req.originalUrl.includes('/vendors/me/'));
    
    console.log('🔍 deletePlan - Route check:', {
      'req.params.id': req.params.id,
      'req.path': req.path,
      'req.originalUrl': req.originalUrl,
      'isMeRoute': isMeRoute,
      'userId': req.user._id?.toString()
    });
    
    // If id is 'me' or route is /vendors/me/plans, get current user's vendor
    if (isMeRoute) {
      vendor = await findVendorByUser(req);
      if (!vendor) {
        console.log('❌ deletePlan - Vendor not found for user:', req.user._id?.toString());
        return res.status(404).json({
          success: false,
          message: 'Vendor profile not found. Please create a vendor profile first.'
        });
      }
      console.log('✅ deletePlan - Vendor found:', vendor.name, 'ID:', vendor._id.toString());
    } else {
      vendor = await LaundryVendor.findById(req.params.id);
    }

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }
    
    // Verify ownership if not admin
    const userId = req.user._id || req.user.id;
    const vendorCreatedBy = vendor.createdBy?.toString();
    const userIdentifier = userId?.toString() || req.user._id?.toString() || req.user.id?.toString();
    
    if (req.user.role !== 'admin' && vendorCreatedBy && userIdentifier && vendorCreatedBy !== userIdentifier) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this vendor'
      });
    }

    const { planId } = req.params;
    vendor.subscriptionPlans = vendor.subscriptionPlans.filter(p => p.id !== planId);
    await vendor.save();

    res.status(200).json({
      success: true,
      message: 'Plan deleted successfully',
      data: vendor.subscriptionPlans
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting plan',
      error: error.message
    });
  }
};