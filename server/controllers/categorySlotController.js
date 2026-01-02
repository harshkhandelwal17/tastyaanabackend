const CategorySlot = require('../models/CategorySlot');
const Category = require('../models/Category');
const {
  NotFoundError,
  ValidationError,
  SlotConflictError,
  SlotUnavailableError,
  InvalidTimeFormatError,
  InvalidDayError
} = require('../utils/errors');
const asyncHandler = require('../middlewares/async');
const moment = require('moment-timezone');

// Helper function to check if a slot is expired
const isSlotExpired = (endTime) => {
  const now = moment().tz('Asia/Kolkata');
  const [hours, minutes] = endTime.split(':').map(Number);
  const slotEnd = moment().tz('Asia/Kolkata').set({ hour: hours, minute: minutes, second: 0 });
  return now.isAfter(slotEnd);
};

// Helper function to get next available date for a slot
const getNextAvailableDate = (dayOfWeek) => {
  const today = moment().tz('Asia/Kolkata');
  const targetDay = moment().tz('Asia/Kolkata').day(dayOfWeek);
  
  if (targetDay.isSameOrBefore(today, 'day')) {
    targetDay.add(1, 'week');
  }
  
  return targetDay.format('YYYY-MM-DD');
};

// @desc    Get all category slots
// @route   GET /api/v1/category-slots
// @access  Private/Admin
exports.getCategorySlots = asyncHandler(async (req, res, next) => {
  const categorySlots = await CategorySlot.find()
    .populate('category', 'name')
    .sort({ category: 1, dayOfWeek: 1 });
  
  res.status(200).json({
    success: true,
    count: categorySlots.length,
    data: categorySlots
  });
});

// @desc    Get slots for a specific category
// @route   GET /api/v1/categories/:categoryId/slots
// @access  Public
exports.getSlotsByCategory = asyncHandler(async (req, res, next) => {
  const category = await Category.findById(req.params.categoryId);
  
  if (!category) {
    return next(
      new NotFoundError('Category not found', { categoryId: req.params.categoryId })
    );
  }
  
  const categorySlots = await CategorySlot.find({ category: req.params.categoryId })
    .sort({ dayOfWeek: 1 });
    
  res.status(200).json({
    success: true,
    data: categorySlots
  });
});

// @desc    Get available slots for a category on a specific day
// @route   GET /api/v1/categories/:categoryId/slots/:dayOfWeek
// @access  Public
exports.getAvailableSlots = asyncHandler(async (req, res, next) => {
  const { categoryId, dayOfWeek } = req.params;
  
  const category = await Category.findById(categoryId);
  if (!category) {
    return next(
      new ErrorResponse(`Category not found with id of ${categoryId}`, 404)
    );
  }
  
  const dayNumber = parseInt(dayOfWeek);
  if (isNaN(dayNumber) || dayNumber < 0 || dayNumber > 6) {
    return next(
      new InvalidDayError('Invalid day of week', { 
        provided: dayOfWeek,
        validRange: { min: 0, max: 6, meaning: '0=Sunday, 6=Saturday' }
      })
    );
  }
  
  const categorySlot = await CategorySlot.findOne({
    category: categoryId,
    dayOfWeek: dayNumber
  });
  
  if (!categorySlot || !categorySlot.isActive) {
    return res.status(200).json({
      success: true,
      data: []
    });
  }
  
  // Filter out inactive slots and slots that have reached max orders
  const availableSlots = categorySlot.slots.filter(slot => 
    slot.isActive && (slot.orderCount < (slot.maxOrders || 100))
  );
  
  res.status(200).json({
    success: true,
    data: {
      ...categorySlot.toObject(),
      slots: availableSlots
    }
  });
});

// @desc    Create or update category slots
// @route   POST /api/v1/category-slots
// @access  Private/Admin
exports.createOrUpdateCategorySlots = asyncHandler(async (req, res, next) => {
  const { category, dayOfWeek, slots } = req.body;
  
  // Check if category exists
  const categoryExists = await Category.findById(category);
  if (!categoryExists) {
    return next(
      new ErrorResponse(`Category not found with id of ${category}`, 404)
    );
  }
  
  // Validate day of week
  const dayNumber = parseInt(dayOfWeek);
  if (isNaN(dayNumber) || dayNumber < 0 || dayNumber > 6) {
    return next(
      new InvalidDayError('Invalid day of week', { 
        provided: dayOfWeek,
        validRange: { min: 0, max: 6, meaning: '0=Sunday, 6=Saturday' }
      })
    );
  }
  
  // Validate slots
  if (!Array.isArray(slots) || slots.length === 0) {
    return next(
      new ValidationError('At least one time slot is required')
    );
  }
  
  // Validate each slot
  const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/; // HH:MM format
  for (const slot of slots) {
    if (!timeRegex.test(slot.startTime) || !timeRegex.test(slot.endTime)) {
      return next(
        new InvalidTimeFormatError(undefined, {
          provided: { startTime: slot.startTime, endTime: slot.endTime },
          expectedFormat: 'HH:MM (24-hour format)'
        })
      );
    }
  }
  
  // Check if slot configuration already exists for this category and day
  let categorySlot = await CategorySlot.findOne({
    category,
    dayOfWeek: dayNumber
  });
  
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayName = days[dayNumber];
  
  if (categorySlot) {
    // Check for slot conflicts
    const now = new Date();
    const existingSlots = new Map(categorySlot.slots.map(s => [`${s.startTime}-${s.endTime}`, s]));
    
    // Check if any slot is being modified while having active orders
    for (const slot of slots) {
      const slotKey = `${slot.startTime}-${slot.endTime}`;
      const existingSlot = existingSlots.get(slotKey);
      
      if (existingSlot && existingSlot.orderCount > 0 && 
          (slot.maxOrders < existingSlot.maxOrders || !slot.isActive)) {
        return next(
          new SlotConflictError('Cannot modify slot with active orders', {
            slot: slotKey,
            activeOrders: existingSlot.orderCount,
            currentMaxOrders: existingSlot.maxOrders,
            requestedMaxOrders: slot.maxOrders,
            requestedActive: slot.isActive
          })
        );
      }
    }
    
    // Update existing slot configuration
    categorySlot.slots = slots;
    categorySlot.dayName = dayName;
    categorySlot.updatedAt = now;
  } else {
    // Create new slot configuration
    categorySlot = new CategorySlot({
      category,
      dayOfWeek: dayNumber,
      dayName,
      slots: slots.map(slot => ({
        ...slot,
        orderCount: 0, // Initialize order count to 0
        isActive: slot.isActive !== false // Default to true if not specified
      }))
    });
  }
  
  await categorySlot.save();
  
  res.status(200).json({
    success: true,
    data: categorySlot
  });
});

// @desc    Delete category slot configuration
// @route   DELETE /api/v1/category-slots/:id
// @access  Private/Admin
exports.deleteCategorySlots = asyncHandler(async (req, res, next) => {
  const categorySlot = await CategorySlot.findById(req.params.id);
  
  if (!categorySlot) {
    return next(
      new ErrorResponse(`Category slot configuration not found with id of ${req.params.id}`, 404)
    );
  }
  
  await categorySlot.remove();
  
  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Toggle category slot active status
// @route   PUT /api/v1/category-slots/:id/status
// @access  Private/Admin
exports.toggleCategorySlotStatus = asyncHandler(async (req, res, next) => {
  const categorySlot = await CategorySlot.findById(req.params.id);
  
  if (!categorySlot) {
    return next(
      new ErrorResponse(`Category slot configuration not found with id of ${req.params.id}`, 404)
    );
  }
  
  categorySlot.isActive = !categorySlot.isActive;
  await categorySlot.save();
  
  res.status(200).json({
    success: true,
    data: categorySlot
  });
});

// @desc    Initialize default slots for a category
// @route   POST /api/v1/categories/:categoryId/init-slots
// @access  Private/Admin
exports.initializeDefaultSlots = asyncHandler(async (req, res, next) => {
  const category = await Category.findById(req.params.categoryId);
  
  if (!category) {
    return next(
      new NotFoundError('Category not found', { categoryId: req.params.categoryId })
    );
  }
  
  const days = [
    { dayOfWeek: 1, dayName: 'Monday' },
    { dayOfWeek: 2, dayName: 'Tuesday' },
    { dayOfWeek: 3, dayName: 'Wednesday' },
    { dayOfWeek: 4, dayName: 'Thursday' },
    { dayOfWeek: 5, dayName: 'Friday' },
  ];
  
  const defaultSlots = [
    { startTime: '09:00', endTime: '12:00' },
    { startTime: '12:00', endTime: '15:00' },
    { startTime: '15:00', endTime: '18:00' },
    { startTime: '18:00', endTime: '21:00' }
  ];
  
  // Delete existing slots for this category
  await CategorySlot.deleteMany({ category: category._id });
  
  // Create default slots for each day
  const createdSlots = await Promise.all(
    days.map(day => 
      CategorySlot.create({
        category: category._id,
        dayOfWeek: day.dayOfWeek,
        dayName: day.dayName,
        slots: defaultSlots.map(slot => ({
          ...slot,
          isActive: true,
          maxOrders: 100,
          orderCount: 0
        }))
      })
    )
  );
  
  res.status(201).json({
    success: true,
    count: createdSlots.length,
    data: createdSlots
  });
});

// @desc    Get available slots with time validation
// @route   GET /api/category-slots/categories/:categoryId/available-slots
// @access  Public
exports.getAvailableSlotsWithTimeValidation = asyncHandler(async (req, res, next) => {
  const { categoryId } = req.params;
  const { date } = req.query;
  
  const category = await Category.findById(categoryId);
  if (!category) {
    return next(
      new NotFoundError('Category not found', { categoryId })
    );
  }
  
  const targetDate = date ? moment(date).tz('Asia/Kolkata') : moment().tz('Asia/Kolkata');
  const dayOfWeek = targetDate.day();
  const isToday = targetDate.isSame(moment().tz('Asia/Kolkata'), 'day');
  
  const categorySlot = await CategorySlot.findOne({
    category: categoryId,
    dayOfWeek: dayOfWeek
  });
  
  if (!categorySlot || !categorySlot.isActive) {
    return res.status(200).json({
      success: true,
      data: {
        availableSlots: [],
        expiredSlots: [],
        date: targetDate.format('YYYY-MM-DD'),
        dayOfWeek: dayOfWeek
      }
    });
  }
  
  const availableSlots = [];
  const expiredSlots = [];
  
  categorySlot.slots.forEach(slot => {
    if (!slot.isActive || slot.orderCount >= (slot.maxOrders || 100)) {
      return;
    }
    
    const slotData = {
      id: slot._id,
      startTime: slot.startTime,
      endTime: slot.endTime,
      label: `${slot.startTime} - ${slot.endTime}`,
      maxOrders: slot.maxOrders || 100,
      orderCount: slot.orderCount,
      isActive: slot.isActive,
      deliveryCharge: slot.deliveryCharge || 0
    };
    
    if (isToday && isSlotExpired(slot.endTime)) {
      expiredSlots.push({
        ...slotData,
        reason: 'Time has passed',
        nextAvailableDate: getNextAvailableDate(dayOfWeek)
      });
    } else {
      availableSlots.push(slotData);
    }
  });
  
  res.status(200).json({
    success: true,
    data: {
      availableSlots,
      expiredSlots,
      date: targetDate.format('YYYY-MM-DD'),
      dayOfWeek: dayOfWeek,
      categoryName: category.name
    }
  });
});

// @desc    Validate slot selection
// @route   POST /api/category-slots/validate-slot
// @access  Public
exports.validateSlotSelection = asyncHandler(async (req, res, next) => {
  const { categoryId, slotId, date } = req.body;
  
  if (!categoryId || !slotId) {
    return next(
      new ValidationError('Category ID and Slot ID are required')
    );
  }
  
  const category = await Category.findById(categoryId);
  if (!category) {
    return next(
      new NotFoundError('Category not found', { categoryId })
    );
  }
  
  const targetDate = date ? moment(date).tz('Asia/Kolkata') : moment().tz('Asia/Kolkata');
  const dayOfWeek = targetDate.day();
  const isToday = targetDate.isSame(moment().tz('Asia/Kolkata'), 'day');
  
  const categorySlot = await CategorySlot.findOne({
    category: categoryId,
    dayOfWeek: dayOfWeek
  });
  
  if (!categorySlot || !categorySlot.isActive) {
    return res.status(400).json({
      success: false,
      message: 'No delivery slots available for this category on the selected day',
      suggestion: 'Please choose a different day or category'
    });
  }
  
  const slot = categorySlot.slots.id(slotId);
  if (!slot) {
    return res.status(400).json({
      success: false,
      message: 'Selected slot not found',
      suggestion: 'Please choose a different slot'
    });
  }
  
  if (!slot.isActive) {
    return res.status(400).json({
      success: false,
      message: 'Selected slot is currently inactive',
      suggestion: 'Please choose a different slot'
    });
  }
  
  if (slot.orderCount >= (slot.maxOrders || 100)) {
    return res.status(400).json({
      success: false,
      message: 'Selected slot is fully booked',
      suggestion: 'Please choose a different slot or date'
    });
  }
  
  if (isToday && isSlotExpired(slot.endTime)) {
    return res.status(400).json({
      success: false,
      message: `This slot (${slot.startTime} - ${slot.endTime}) has already passed`,
      suggestion: 'Please choose an upcoming slot or schedule for tomorrow',
      nextAvailableDate: getNextAvailableDate(dayOfWeek)
    });
  }
  
  res.status(200).json({
    success: true,
    message: 'Slot is available for booking',
    data: {
      slotId: slot._id,
      startTime: slot.startTime,
      endTime: slot.endTime,
      deliveryCharge: slot.deliveryCharge || 0
    }
  });
});

// @desc    Get alternative slots when current selection is unavailable
// @route   GET /api/category-slots/alternative-slots
// @access  Public
exports.getAlternativeSlots = asyncHandler(async (req, res, next) => {
  const { categoryIds } = req.query; // Comma-separated category IDs
  
  if (!categoryIds) {
    return next(
      new ValidationError('Category IDs are required')
    );
  }
  
  const categoryIdArray = categoryIds.split(',');
  const alternatives = [];
  
  // Get today's remaining slots and tomorrow's slots
  const today = moment().tz('Asia/Kolkata');
  const tomorrow = moment().tz('Asia/Kolkata').add(1, 'day');
  
  for (const categoryId of categoryIdArray) {
    const category = await Category.findById(categoryId.trim());
    if (!category) continue;
    
    // Today's remaining slots
    const todaySlots = await CategorySlot.findOne({
      category: categoryId,
      dayOfWeek: today.day()
    });
    
    if (todaySlots && todaySlots.isActive) {
      const availableToday = todaySlots.slots.filter(slot => 
        slot.isActive && 
        slot.orderCount < (slot.maxOrders || 100) &&
        !isSlotExpired(slot.endTime)
      );
      
      if (availableToday.length > 0) {
        alternatives.push({
          category: category.name,
          categoryId: categoryId,
          date: today.format('YYYY-MM-DD'),
          dayName: 'Today',
          slots: availableToday.map(slot => ({
            id: slot._id,
            startTime: slot.startTime,
            endTime: slot.endTime,
            label: `${slot.startTime} - ${slot.endTime}`,
            deliveryCharge: slot.deliveryCharge || 0
          }))
        });
      }
    }
    
    // Tomorrow's slots
    const tomorrowSlots = await CategorySlot.findOne({
      category: categoryId,
      dayOfWeek: tomorrow.day()
    });
    
    if (tomorrowSlots && tomorrowSlots.isActive) {
      const availableTomorrow = tomorrowSlots.slots.filter(slot => 
        slot.isActive && 
        slot.orderCount < (slot.maxOrders || 100)
      );
      
      if (availableTomorrow.length > 0) {
        alternatives.push({
          category: category.name,
          categoryId: categoryId,
          date: tomorrow.format('YYYY-MM-DD'),
          dayName: 'Tomorrow',
          slots: availableTomorrow.map(slot => ({
            id: slot._id,
            startTime: slot.startTime,
            endTime: slot.endTime,
            label: `${slot.startTime} - ${slot.endTime}`,
            deliveryCharge: slot.deliveryCharge || 0
          }))
        });
      }
    }
  }
  
  res.status(200).json({
    success: true,
    data: {
      alternatives,
      currentTime: moment().tz('Asia/Kolkata').format('HH:mm'),
      currentDate: today.format('YYYY-MM-DD')
    }
  });
});
