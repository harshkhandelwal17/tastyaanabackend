exports.schedulePickup = async (req, res) => {
  try {
    const { subscriptionId, pickupDate, tiffinDetails, notes } = req.body;

    // Verify subscription
    const subscription = await Subscription.findOne({
      _id: subscriptionId,
      userId: req.userId,
      status: 'active',
      tiffinWashIncluded: true
    });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Valid subscription with tiffin service not found'
      });
    }

    // Check if pickup already scheduled for this date
    const existingPickup = await TiffinWashLog.findOne({
      userId: req.userId,
      subscriptionId,
      date: new Date(pickupDate),
      status: { $in: ['scheduled', 'picked', 'washing'] }
    });

    if (existingPickup) {
      return res.status(400).json({
        success: false,
        message: 'Pickup already scheduled for this date'
      });
    }

    // Create tiffin wash log
    const tiffinLog = new TiffinWashLog({
      userId: req.userId,
      subscriptionId,
      date: new Date(pickupDate),
      tiffinDetails: {
        type: tiffinDetails.type || 'steel',
        count: tiffinDetails.count || 1,
        condition: tiffinDetails.condition || 'good'
      },
      pickupDetails: {
        scheduledTime: new Date(pickupDate + 'T10:00:00'), // Default 10 AM pickup
        pickupNotes: notes
      },
      status: 'scheduled'
    });

    await tiffinLog.save();

    // Send notification
    await createNotification({
      userId: req.userId,
      title: 'Tiffin Pickup Scheduled',
      message: `Your tiffin pickup has been scheduled for ${new Date(pickupDate).toDateString()}`,
      type: 'tiffin-service',
      data: { tiffinLogId: tiffinLog._id }
    });

    res.status(201).json({
      success: true,
      message: 'Tiffin pickup scheduled successfully',
      data: tiffinLog
    });

  } catch (error) {
    console.error('Schedule pickup error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to schedule pickup',
      error: error.message
    });
  }
};

/**
 * Get tiffin wash logs
 */
exports.getTiffinLogs = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;

    const filter = { userId: req.userId };
    if (status) filter.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const tiffinLogs = await TiffinWashLog.find(filter)
      .populate('subscriptionId', 'planId')
      .sort({ date: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await TiffinWashLog.countDocuments(filter);

    res.json({
      success: true,
      data: {
        tiffinLogs,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          total,
          hasNext: skip + parseInt(limit) < total,
          hasPrev: parseInt(page) > 1
        }
      }
    });

  } catch (error) {
    console.error('Get tiffin logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tiffin logs',
      error: error.message
    });
  }
};

/**
 * Update tiffin status (Delivery partner/Admin)
 */
exports.updateTiffinStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes, image } = req.body;

    // Check if user has permission
    const user = await User.findById(req.userId);
    if (!['delivery', 'admin', 'superadmin'].includes(user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const validStatuses = ['scheduled', 'picked', 'washing', 'washed', 'out-for-delivery', 'delivered', 'delayed', 'lost'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    const updateData = { status };

    // Update specific details based on status
    switch (status) {
      case 'picked':
        updateData['pickupDetails.actualTime'] = new Date();
        updateData['pickupDetails.pickupBy'] = req.userId;
        updateData['pickupDetails.pickupNotes'] = notes;
        if (image) updateData['pickupDetails.pickupImage'] = image;
        break;
      case 'washing':
        updateData['washingDetails.startTime'] = new Date();
        updateData['washingDetails.washedBy'] = req.userId;
        break;
      case 'washed':
        updateData['washingDetails.endTime'] = new Date();
        updateData['washingDetails.washingNotes'] = notes;
        break;
      case 'delivered':
        updateData['deliveryDetails.actualTime'] = new Date();
        updateData['deliveryDetails.deliveredBy'] = req.userId;
        updateData['deliveryDetails.deliveryNotes'] = notes;
        if (image) updateData['deliveryDetails.deliveryImage'] = image;
        break;
    }

    const tiffinLog = await TiffinWashLog.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    ).populate('userId', 'name phone');

    if (!tiffinLog) {
      return res.status(404).json({
        success: false,
        message: 'Tiffin log not found'
      });
    }

    // Send notification to customer
    await createNotification({
      userId: tiffinLog.userId._id,
      title: `Tiffin ${status}`,
      message: `Your tiffin is now ${status}`,
      type: 'tiffin-service',
      data: { tiffinLogId: tiffinLog._id }
    });

    res.json({
      success: true,
      message: 'Tiffin status updated successfully',
      data: tiffinLog
    });

  } catch (error) {
    console.error('Update tiffin status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update tiffin status',
      error: error.message
    });
  }
};

/**
 * Rate tiffin service
 */
exports.rateTiffinService = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    }

    const tiffinLog = await TiffinWashLog.findOne({
      _id: id,
      userId: req.userId,
      status: 'delivered'
    });

    if (!tiffinLog) {
      return res.status(404).json({
        success: false,
        message: 'Tiffin log not found or not eligible for rating'
      });
    }

    if (tiffinLog.feedback.customerRating) {
      return res.status(400).json({
        success: false,
        message: 'Service already rated'
      });
    }

    tiffinLog.feedback = {
      customerRating: rating,
      customerComment: comment,
      ratedAt: new Date()
    };

    await tiffinLog.save();

    res.json({
      success: true,
      message: 'Tiffin service rated successfully',
      data: tiffinLog
    });

  } catch (error) {
    console.error('Rate tiffin service error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to rate tiffin service',
      error: error.message
    });
  }
};