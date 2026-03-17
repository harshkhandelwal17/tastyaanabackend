

const multer = require('multer');
const { v4: uuidv4 } = require('uuid');

// ==================== CONFIGURATION ====================
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_FILES = 5;

// ==================== STORAGE CONFIG ====================
// Use memory storage for file uploads
const storage = multer.memoryStorage();

// ==================== FILE VALIDATION ====================
const fileFilter = (req, file, cb) => {
  console.log('File filter - checking:', file.originalname, file.mimetype);
  
  const allowedTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/svg+xml'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    console.log('File type approved:', file.mimetype);
    cb(null, true);
  } else {
    console.log('File type rejected:', file.mimetype);
    cb(new Error('Invalid file type. Only JPEG, PNG, WEBP, and SVG are allowed.'), false);
  }
};

// ==================== MULTER INSTANCE ====================
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: MAX_FILES
  }
});

// ==================== ERROR HANDLING ====================
const handleUploadError = (err, req, res, next) => {
  console.log('Upload error:', err);
  
  if (err instanceof multer.MulterError) {
    let message = 'File upload error';

    switch (err.code) {
      case 'LIMIT_FILE_SIZE':
        message = `File too large. Maximum ${MAX_FILE_SIZE / 1024 / 1024}MB allowed.`;
        break;
      case 'LIMIT_FILE_COUNT':
        message = `Maximum ${MAX_FILES} files allowed per upload.`;
        break;
      case 'LIMIT_UNEXPECTED_FILE':
        message = 'Unexpected file field in upload request.';
        break;
    }

    return res.status(400).json({
      success: false,
      message
    });
  }

  if (err.message && err.message.includes('Invalid file type')) {
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }

  next(err);
};

// ==================== HELPER MIDDLEWARES ====================
const singleUpload = (fieldName) => upload.single(fieldName);
const multiUpload = (fieldName, maxCount) => upload.array(fieldName, maxCount);
const mixedUpload = (fields) => upload.fields(fields);

// Debug middleware to log file data
const debugUpload = (req, res, next) => {
  console.log('=== UPLOAD DEBUG ===');
  console.log('Files received:', req.files ? req.files.length : 0);
  if (req.files) {
    req.files.forEach((file, index) => {
      console.log(`File ${index}:`, {
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        hasBuffer: !!file.buffer,
        bufferLength: file.buffer ? file.buffer.length : 0
      });
    });
  }
  next();
};

module.exports = {
  upload,
  singleUpload,
  multiUpload,
  mixedUpload,
  handleUploadError,
  debugUpload
};