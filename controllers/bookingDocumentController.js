const cloudinary = require('../config/cloudinary');
const VehicleBooking = require('../models/VehicleBooking');
const Vehicle = require('../models/Vehicle');

// Upload booking documents to Cloudinary and save to booking
const uploadBookingDocuments = async (req, res) => {
  try {
    console.log('📂 Upload Booking Documents Controller Hit');
    console.log('Files received:', req.files ? req.files.length : '0');
    console.log('Body:', req.body);

    const { bookingId } = req.body; // Get booking ID from request

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded'
      });
    }

    if (!bookingId) {
      return res.status(400).json({
        success: false,
        message: 'Booking ID is required'
      });
    }

    // Find the booking
    // Find the booking (by _id or custom bookingId)
    let booking = null;
    // Check if it's a valid ObjectId
    if (bookingId.match(/^[0-9a-fA-F]{24}$/)) {
      booking = await VehicleBooking.findById(bookingId);
    }

    // Fallback to custom bookingId field if not found by _id
    if (!booking) {
      booking = await VehicleBooking.findOne({ bookingId });
    }
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check permission (user owns booking or is admin/seller)
    const hasAccess = !req.user || req.user.role === 'admin' ||
      booking.userId.toString() === req.user.id ||
      (req.user.role === 'seller' && booking.vehicleId &&
        await Vehicle.findOne({ _id: booking.vehicleId, sellerId: req.user.id }));

    if (req.user && !hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to upload documents for this booking'
      });
    }

    const uploadPromises = req.files.map(async (file) => {
      // Files are already uploaded to Cloudinary by the middleware
      // file.path contains the secure Cloudinary URL
      // file.filename contains the public_id
      return {
        type: file.fieldname || 'document',
        url: file.path,
        publicId: file.filename,
        originalName: file.originalname,
        size: file.size,
        uploadedAt: new Date(),
        verified: false
      };
    });

    const uploadedDocuments = await Promise.all(uploadPromises);

    // Add documents to booking ONLY if booking exists
    if (booking) {
      booking.documents.push(...uploadedDocuments);
      await booking.save();
    }

    res.json({
      success: true,
      message: 'Documents uploaded successfully',
      data: {
        bookingId: booking ? booking.bookingId : null,
        documents: uploadedDocuments,
        totalDocuments: booking ? booking.documents.length : uploadedDocuments.length
      }
    });

  } catch (error) {
    console.error('Error uploading documents:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload documents',
      error: error.message
    });
  }
};

// Update booking documents
const updateBookingDocuments = async (req, res) => {
  try {
    const { id } = req.params;
    const { documents } = req.body;

    const booking = await VehicleBooking.findById(id);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check permission
    const hasAccess = req.user.role === 'admin' ||
      booking.userId.toString() === req.user.id ||
      (req.user.role === 'seller' && booking.vehicleId &&
        await Vehicle.findOne({ _id: booking.vehicleId, sellerId: req.user.id }));

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this booking'
      });
    }

    // Validate documents
    const validDocumentTypes = ['rental-agreement', 'id-proof', 'driving-license', 'address-proof', 'security-deposit-receipt'];
    const validatedDocuments = documents.map(doc => {
      if (!validDocumentTypes.includes(doc.type)) {
        throw new Error(`Invalid document type: ${doc.type}`);
      }
      return {
        type: doc.type,
        url: doc.url,
        verified: false,
        uploadedAt: new Date()
      };
    });

    // Update booking documents
    booking.documents = [...booking.documents, ...validatedDocuments];
    await booking.save();

    res.json({
      success: true,
      message: 'Documents updated successfully',
      data: {
        documents: booking.documents
      }
    });

  } catch (error) {
    console.error('Error updating booking documents:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update documents',
      error: error.message
    });
  }
};

// Mark vehicle as returned and make it available
const markVehicleReturned = async (req, res) => {
  try {
    const { id } = req.params; // booking ID
    const { condition = 'good', damageNotes, verificationCode } = req.body;

    const booking = await VehicleBooking.findById(id).populate('vehicleId');
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Verify drop verification code
    if (verificationCode !== booking.verificationCodes.drop.code) {
      return res.status(400).json({
        success: false,
        message: 'Invalid drop verification code'
      });
    }

    // Check permission (seller or admin)
    const hasAccess = req.user.role === 'admin' ||
      (req.user.role === 'seller' && booking.vehicleId &&
        await Vehicle.findOne({ _id: booking.vehicleId._id, sellerId: req.user.id }));

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to return this vehicle'
      });
    }

    // Update booking return status
    booking.vehicleReturn = {
      submitted: true,
      submittedAt: new Date(),
      submittedBy: req.user.id,
      condition,
      damageNotes,
      vehicleAvailableAgain: true,
      madeAvailableAt: new Date()
    };

    // Mark drop verification as verified
    booking.verificationCodes.drop.verified = true;
    booking.verificationCodes.drop.verifiedAt = new Date();
    booking.verificationCodes.drop.verifiedBy = req.user.id;

    // Update booking status to completed
    booking.bookingStatus = 'completed';
    booking.actualEndTime = new Date();

    await booking.save();

    // Update vehicle availability
    if (booking.vehicleId) {
      await Vehicle.findByIdAndUpdate(booking.vehicleId._id, {
        isAvailable: true,
        lastReturnedAt: new Date()
      });
    }

    res.json({
      success: true,
      message: 'Vehicle returned successfully and made available',
      data: {
        bookingId: booking.bookingId,
        vehicleReturn: booking.vehicleReturn,
        verificationCodes: booking.verificationCodes
      }
    });

  } catch (error) {
    console.error('Error marking vehicle as returned:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process vehicle return',
      error: error.message
    });
  }
};

// Upload documents without booking ID (for offline bookings being created)
const uploadDocumentsOnly = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded'
      });
    }

    const uploadedDocuments = req.files.map((file) => ({
      type: file.fieldname || 'document',
      url: file.path,
      publicId: file.filename,
      originalName: file.originalname,
      size: file.size,
      uploadedAt: new Date(),
      verified: false
    }));

    res.json({
      success: true,
      message: 'Documents uploaded successfully',
      files: uploadedDocuments
    });

  } catch (error) {
    console.error('Error uploading documents:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload documents',
      error: error.message
    });
  }
};

module.exports = {
  uploadBookingDocuments,
  updateBookingDocuments,
  markVehicleReturned,
  uploadDocumentsOnly
};