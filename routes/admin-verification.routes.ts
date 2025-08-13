import { Router } from 'express';
import { AdminVerificationController } from '../controllers/admin-verification.controller';
import { authenticate, authorize } from '../middlewares/Auth.middleware';

const router = Router();
const adminVerificationController = new AdminVerificationController();

// All routes require authentication and admin role
router.use(authenticate);
router.use(authorize('ADMIN'));

// Get all pending verifications
// GET /api/admin/verifications/pending
router.get('/pending', adminVerificationController.getPendingVerifications);

// Get verification statistics
// GET /api/admin/verifications/stats
router.get('/stats', adminVerificationController.getVerificationStats);

// Get specific verification details
// GET /api/admin/verifications/:lawyerId
router.get('/:lawyerId', adminVerificationController.getVerificationDetails);

// Approve lawyer verification
// POST /api/admin/verifications/:lawyerId/approve
router.post('/:lawyerId/approve', adminVerificationController.approveVerification);

// Reject lawyer verification
// POST /api/admin/verifications/:lawyerId/reject
router.post('/:lawyerId/reject', adminVerificationController.rejectVerification);

// Require resubmission
// POST /api/admin/verifications/:lawyerId/resubmit
router.post('/:lawyerId/resubmit', adminVerificationController.requireResubmission);

export default router;
