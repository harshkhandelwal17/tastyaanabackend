const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  timeout: 120000 // Increase timeout to 120 seconds for slow uploads
});

// Create storage configuration
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'Tastyaanaimg', // Folder in Cloudinary
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [
      {
        width: 1000,
        height: 1000,
        crop: 'limit',
        quality: 'auto:good',
        fetch_format: 'auto'
      }
    ]
  }
});

// Create multer upload middleware
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit5
  },
  fileFilter: (req, file, cb) => {
    // Check file type
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Helper functions
const deleteImage = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error('Error deleting image from Cloudinary:', error);
    throw error;
  }
};

const uploadFromBuffer = async (buffer, options = {}) => {
  try {
    return new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder: 'Tastyaanaimg',
          ...options
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        }
      ).end(buffer);
    });
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    throw error;
  }
};

// Create video storage configuration
const videoStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'Tastyaanavideos', // Separate folder for videos
    resource_type: 'video',
    allowed_formats: ['mp4', 'webm', 'ogg', 'avi', 'mov'],
    transformation: [
      {
        quality: 'auto:good',
        fetch_format: 'auto'
      }
    ]
  }
});

// Create vehicle image storage configuration
const vehicleStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'Tastyaana/vehicles', // Separate folder for vehicle images
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [
      {
        width: 1200,
        height: 800,
        crop: 'limit',
        quality: 'auto:good',
        fetch_format: 'auto'
      }
    ]
  }
});

// Create multer upload middleware for videos
const videoUpload = multer({
  storage: videoStorage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit for videos
  },
  fileFilter: (req, file, cb) => {
    // Check file type
    if (file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only video files are allowed!'), false);
    }
  }
});

// Create multer upload middleware for vehicle images
const vehicleUpload = multer({
  storage: vehicleStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit for vehicle images
  },
  fileFilter: (req, file, cb) => {
    // Check file type
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Helper function to delete video
const deleteVideo = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: 'video'
    });
    return result;
  } catch (error) {
    console.error('Error deleting video from Cloudinary:', error);
    throw error;
  }
};

// Create document storage configuration
const documentStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'Tastyaana/booking-documents', // Separate folder for documents
    resource_type: 'auto', // Allow both images and raw files (pdfs)
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'pdf'],
    use_filename: true,
    unique_filename: true
  }
});

// Create multer upload middleware for documents
const documentUpload = multer({
  storage: documentStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit for documents
  },
  fileFilter: (req, file, cb) => {
    // Check file type - images and pdfs
    if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only image and PDF files are allowed!'), false);
    }
  }
});

module.exports = {
  cloudinary,
  upload,
  videoUpload,
  vehicleUpload,
  documentUpload, // Export document upload middleware
  deleteImage,
  deleteVideo,
  uploadFromBuffer
};