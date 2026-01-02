const Bhandara = require('../models/Bhandara');

const bhandaraController = {
  // Get all approved Bhandaras
  getAllBhandaras: async (req, res) => {
    try {
      const { status = 'approved', limit = 50, skip = 0 } = req.query;
      
      // Build query
      const query = {
        isActive: true,
        status: status,
        dateTimeEnd: { $gte: new Date() } // Only future events
      };

      const bhandaras = await Bhandara.find(query)
        .sort({ trustScore: -1, dateTimeStart: 1 }) // Sort by trust score first, then by start time
        .limit(parseInt(limit))
        .skip(parseInt(skip))
        .select('-createdBy -likes.user -dislikes.user') // Don't expose creator details or individual user feedback
        .lean();

      const total = await Bhandara.countDocuments(query);

      res.json({
        success: true,
        data: bhandaras,
        total,
        hasMore: (parseInt(skip) + bhandaras.length) < total
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching Bhandaras',
        error: error.message
      });
    }
  },

  // Create new Bhandara
  createBhandara: async (req, res) => {
    try {
      const {
        title,
        description,
        location,
        foodItems,
        dateTimeStart,
        dateTimeEnd,
        organizerName,
        contact
      } = req.body;

      // Validate required fields (contact is now optional)
      if (!title || !location?.address || !dateTimeStart || !dateTimeEnd || !organizerName) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields',
          required: ['title', 'location.address', 'dateTimeStart', 'dateTimeEnd', 'organizerName']
        });
      }

      // Validate dates
      const startDate = new Date(dateTimeStart);
      const endDate = new Date(dateTimeEnd);
      const now = new Date();

      if (startDate <= now) {
        return res.status(400).json({
          success: false,
          message: 'Start time must be in the future'
        });
      }

      if (endDate <= startDate) {
        return res.status(400).json({
          success: false,
          message: 'End time must be after start time'
        });
      }

      // Check for duplicate events (same location and overlapping time)
      const existingEvent = await Bhandara.findOne({
        'location.address': { $regex: new RegExp(location.address, 'i') },
        $or: [
          {
            dateTimeStart: { $lte: startDate },
            dateTimeEnd: { $gte: startDate }
          },
          {
            dateTimeStart: { $lte: endDate },
            dateTimeEnd: { $gte: endDate }
          },
          {
            dateTimeStart: { $gte: startDate },
            dateTimeEnd: { $lte: endDate }
          }
        ],
        isActive: true,
        status: { $in: ['pending', 'approved'] }
      });

      if (existingEvent) {
        return res.status(409).json({
          success: false,
          message: 'A Bhandara event already exists at this location during the specified time'
        });
      }

      // Process food items
      const processedFoodItems = Array.isArray(foodItems) 
        ? foodItems 
        : (typeof foodItems === 'string' ? foodItems.split(',').map(item => item.trim()) : []);

      // Create new Bhandara
      const bhandaraData = {
        title: title.trim(),
        description: description?.trim() || '',
        location: {
          address: location.address.trim(),
          lat: location.lat || null,
          lng: location.lng || null
        },
        foodItems: processedFoodItems.filter(item => item.length > 0),
        dateTimeStart: startDate,
        dateTimeEnd: endDate,
        organizerName: organizerName.trim(),
        contact: contact.trim(),
        createdBy: req.user?.id || null // If user authentication is available
      };

      const bhandara = new Bhandara(bhandaraData);
      await bhandara.save();

      res.status(201).json({
        success: true,
        message: 'Bhandara submitted successfully. It will be reviewed and approved shortly.',
        data: {
          id: bhandara._id,
          title: bhandara.title,
          status: bhandara.status
        }
      });
    } catch (error) {
      if (error.name === 'ValidationError') {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: Object.values(error.errors).map(err => err.message)
        });
      }

      res.status(500).json({
        success: false,
        message: 'Error creating Bhandara',
        error: error.message
      });
    }
  },

  // Get Bhandara by ID
  getBhandaraById: async (req, res) => {
    try {
      const { id } = req.params;
      
      const bhandara = await Bhandara.findOne({
        _id: id,
        isActive: true
      }).select('-createdBy');

      if (!bhandara) {
        return res.status(404).json({
          success: false,
          message: 'Bhandara not found'
        });
      }

      res.json({
        success: true,
        data: bhandara
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching Bhandara',
        error: error.message
      });
    }
  },

  // Get user's submitted Bhandaras
  getUserBhandaras: async (req, res) => {
    try {
      const userId = req.user.id; // From authentication middleware
      const { limit = 50, skip = 0 } = req.query;
      
      const query = {
        createdBy: userId,
        isActive: true
      };

      const bhandaras = await Bhandara.find(query)
        .sort({ createdAt: -1 }) // Most recent first
        .limit(parseInt(limit))
        .skip(parseInt(skip))
        .populate('approvedBy', 'name')
        .populate('rejectedBy', 'name')
        .populate('verifiedBy', 'name')
        .lean();

      const total = await Bhandara.countDocuments(query);

      res.json({
        success: true,
        data: bhandaras,
        total,
        hasMore: (parseInt(skip) + bhandaras.length) < total
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching your Bhandaras',
        error: error.message
      });
    }
  },

  // Admin: Update Bhandara status
  updateBhandaraStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!['pending', 'approved', 'rejected'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status. Must be pending, approved, or rejected'
        });
      }

      const bhandara = await Bhandara.findByIdAndUpdate(
        id,
        { status, updatedAt: Date.now() },
        { new: true }
      );

      if (!bhandara) {
        return res.status(404).json({
          success: false,
          message: 'Bhandara not found'
        });
      }

      res.json({
        success: true,
        message: `Bhandara ${status} successfully`,
        data: bhandara
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error updating Bhandara status',
        error: error.message
      });
    }
  },

  // Get upcoming Bhandaras (next 7 days)
  getUpcomingBhandaras: async (req, res) => {
    try {
      const now = new Date();
      const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      const bhandaras = await Bhandara.find({
        isActive: true,
        status: 'approved',
        dateTimeStart: { $gte: now, $lte: nextWeek }
      })
      .sort({ dateTimeStart: 1 })
      .limit(10)
      .select('-createdBy')
      .lean();

      res.json({
        success: true,
        data: bhandaras,
        count: bhandaras.length
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching upcoming Bhandaras',
        error: error.message
      });
    }
  },

  // Admin: Toggle verification status
  toggleVerification: async (req, res) => {
    try {
      const { id } = req.params;
      const { isVerified } = req.body;
      const adminId = req.user?._id; // Assuming admin user ID is available in req.user

      const updateData = {
        isVerified: !!isVerified,
        updatedAt: Date.now()
      };

      if (isVerified) {
        updateData.verifiedBy = adminId;
        updateData.verifiedAt = new Date();
      } else {
        updateData.verifiedBy = null;
        updateData.verifiedAt = null;
      }

      const bhandara = await Bhandara.findByIdAndUpdate(
        id,
        updateData,
        { new: true }
      );

      if (!bhandara) {
        return res.status(404).json({
          success: false,
          message: 'Bhandara not found'
        });
      }

      res.json({
        success: true,
        message: `Bhandara ${isVerified ? 'verified' : 'unverified'} successfully`,
        data: bhandara
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error updating verification status',
        error: error.message
      });
    }
  },

  // Like a Bhandara
  likeBhandara: async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user._id;

      const bhandara = await Bhandara.findById(id);
      if (!bhandara) {
        return res.status(404).json({
          success: false,
          message: 'Bhandara not found'
        });
      }

      // Check if user already liked
      const alreadyLiked = bhandara.likes.some(like => like.user.equals(userId));
      
      if (alreadyLiked) {
        // Remove like (toggle off)
        bhandara.removeFeedback(userId);
      } else {
        // Add like
        bhandara.addLike(userId);
      }

      await bhandara.save();

      res.json({
        success: true,
        message: alreadyLiked ? 'Like removed' : 'Bhandara liked',
        data: {
          totalLikes: bhandara.totalLikes,
          totalDislikes: bhandara.totalDislikes,
          trustScore: bhandara.trustScore,
          userLiked: !alreadyLiked,
          userDisliked: false
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error updating like status',
        error: error.message
      });
    }
  },

  // Dislike a Bhandara
  dislikeBhandara: async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user._id;

      const bhandara = await Bhandara.findById(id);
      if (!bhandara) {
        return res.status(404).json({
          success: false,
          message: 'Bhandara not found'
        });
      }

      // Check if user already disliked
      const alreadyDisliked = bhandara.dislikes.some(dislike => dislike.user.equals(userId));
      
      if (alreadyDisliked) {
        // Remove dislike (toggle off)
        bhandara.removeFeedback(userId);
      } else {
        // Add dislike
        bhandara.addDislike(userId);
      }

      await bhandara.save();

      res.json({
        success: true,
        message: alreadyDisliked ? 'Dislike removed' : 'Bhandara disliked',
        data: {
          totalLikes: bhandara.totalLikes,
          totalDislikes: bhandara.totalDislikes,
          trustScore: bhandara.trustScore,
          userLiked: false,
          userDisliked: !alreadyDisliked
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error updating dislike status',
        error: error.message
      });
    }
  },

  // Get Bhandara feedback status for a user
  getBhandaraFeedback: async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user._id;

      const bhandara = await Bhandara.findById(id).select('likes dislikes totalLikes totalDislikes trustScore');
      if (!bhandara) {
        return res.status(404).json({
          success: false,
          message: 'Bhandara not found'
        });
      }

      const userLiked = bhandara.likes.some(like => like.user.equals(userId));
      const userDisliked = bhandara.dislikes.some(dislike => dislike.user.equals(userId));

      res.json({
        success: true,
        data: {
          totalLikes: bhandara.totalLikes,
          totalDislikes: bhandara.totalDislikes,
          trustScore: bhandara.trustScore,
          userLiked,
          userDisliked
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching feedback status',
        error: error.message
      });
    }
  }
};

module.exports = bhandaraController;