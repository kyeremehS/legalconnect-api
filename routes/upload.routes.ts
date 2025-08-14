import { Router } from 'express';
import { UploadController } from '../controllers/upload.controller';
import upload, { documentUpload, videoUpload } from '../utils/multer';

const router = Router();
const uploadController = new UploadController();

// Multiple document upload (for registration form)
router.post('/lawyer/:lawyerId/documents', 
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
router.post('/lawyer/:lawyerId/document/:documentType',
  documentUpload.single('file'),
  uploadController.uploadSingleDocument.bind(uploadController)
);

// Video upload
router.post('/lawyer/:lawyerId/video',
  videoUpload.single('video'),
  uploadController.uploadVideoIntro.bind(uploadController)
);

// Delete document
router.delete('/lawyer/:lawyerId/document/:documentType',
  uploadController.deleteDocument.bind(uploadController)
);

// Get all documents for a lawyer
router.get('/lawyer/:lawyerId/documents',
  uploadController.getLawyerDocuments.bind(uploadController)
);

// Get presigned URL for secure access
router.get('/presigned/:key',
  uploadController.getPresignedUrl.bind(uploadController)
);

export default router;
