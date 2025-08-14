import multer from 'multer';

// Use memory storage for S3 uploads (files stored in buffer)
const storage = multer.memoryStorage();

const fileFilter = (req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = [
    // Images
    'image/jpeg', 
    'image/jpg',
    'image/png', 
    // Documents
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    // Videos
    'video/mp4',
    'video/avi',
    'video/quicktime',
    'video/x-msvideo',
    'video/webm',
    'video/x-ms-wmv'
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type: ${file.mimetype}. Allowed types: PDF, DOC, DOCX, JPG, PNG, MP4, AVI, QuickTime, WebM, WMV`));
  }
};

// Main upload configuration
const upload = multer({
  storage: storage,
  limits: { 
    fileSize: 50 * 1024 * 1024, // 50MB limit (increased for videos)
    files: 10 // Maximum 10 files
  },
  fileFilter: fileFilter
});

// Specialized configurations
export const documentUpload = multer({
  storage: storage,
  limits: { 
    fileSize: 10 * 1024 * 1024, // 10MB for documents
    files: 5
  },
  fileFilter: (req, file, cb) => {
    const documentTypes = [
      'image/jpeg', 
      'image/jpg',
      'image/png', 
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    if (documentTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, DOC, DOCX, JPG, and PNG files are allowed for documents'));
    }
  }
});

export const videoUpload = multer({
  storage: storage,
  limits: { 
    fileSize: 100 * 1024 * 1024, // 100MB for videos
    files: 1
  },
  fileFilter: (req, file, cb) => {
    const videoTypes = [
      'video/mp4',
      'video/avi',
      'video/quicktime',
      'video/x-msvideo',
      'video/webm',
      'video/x-ms-wmv'
    ];
    
    if (videoTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only MP4, AVI, QuickTime, WebM, and WMV video files are allowed'));
    }
  }
});

export default upload;