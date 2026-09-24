import { Router } from 'express';
import { UploadController } from '../controllers/upload.controller';
import { authenticate, authorize } from '../middlewares/Auth.middleware';
import upload, { documentUpload, videoUpload } from '../utils/multer';

const router = Router();
const uploadController = new UploadController();

// All upload routes require authentication. Writes require LAWYER or ADMIN.
const canWrite = [authenticate, authorize('LAWYER', 'ADMIN')];

// Multiple document upload (for registration form)
router.post('/lawyer/:lawyerId/documents', ...canWrite,
  documentUpload.fields([
    { name: 'practisingCertificate', maxCount: 1 },
    { name: 'barCertificate', maxCount: 1 },
    { name: 'idDocument', maxCount: 1 },
    { name: 'cvResume', maxCount: 1 },
    { name: 'profilePhoto', maxCount: 1 }
  ]),
  uploadController.uploadLawyerDocuments.bind(uploadController)
);

// Single document upload
router.post('/lawyer/:lawyerId/document/:documentType', ...canWrite,
  documentUpload.single('file'),
  uploadController.uploadSingleDocument.bind(uploadController)
);

// Video upload
router.post('/lawyer/:lawyerId/video', ...canWrite,
  videoUpload.single('video'),
  uploadController.uploadVideoIntro.bind(uploadController)
);

// Video upload with metadata (title, description, tags, etc.)
router.post('/lawyer/:lawyerId/video-with-metadata', ...canWrite,
  videoUpload.single('video'),
  uploadController.uploadVideoWithMetadata.bind(uploadController)
);

// Delete document
router.delete('/lawyer/:lawyerId/document/:documentType', ...canWrite,
  uploadController.deleteDocument.bind(uploadController)
);

// Get all documents for a lawyer
router.get('/lawyer/:lawyerId/documents', authenticate,
  uploadController.getLawyerDocuments.bind(uploadController)
);

// Get presigned URL for secure access
router.get('/presigned/:key', authenticate,
  uploadController.getPresignedUrl.bind(uploadController)
);

export default router;
