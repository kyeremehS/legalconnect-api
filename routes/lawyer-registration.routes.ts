import { Router } from 'express';
import { LawyerRegistrationController } from '../controllers/lawyer-registration.controller';
import { authenticate, authorize, rateLimit } from '../middlewares/Auth.middleware';

const router = Router();
const lawyerRegistrationController = new LawyerRegistrationController();

// Public routes (lawyer registration and verification) with rate limiting
router.post('/register', rateLimit(5, 60 * 60 * 1000), async (req, res) => {
  await lawyerRegistrationController.registerLawyer(req, res);
});

router.post('/verify-certificate', rateLimit(20, 15 * 60 * 1000), async (req, res) => {
  await lawyerRegistrationController.verifyCertificate(req, res);
});

// Admin routes (require authentication and admin role)
router.use('/admin', authenticate, authorize('ADMIN'));

router.get('/admin/applications', async (req, res) => {
  await lawyerRegistrationController.getAllApplications(req, res);
});

router.get('/admin/applications/:id', async (req, res) => {
  await lawyerRegistrationController.getApplicationDetails(req, res);
});

router.put('/admin/applications/:id/approve', async (req, res) => {
  await lawyerRegistrationController.approveApplication(req, res);
});

router.put('/admin/applications/:id/reject', async (req, res) => {
  await lawyerRegistrationController.rejectApplication(req, res);
});

router.get('/admin/stats', async (req, res) => {
  await lawyerRegistrationController.getVerificationStats(req, res);
});

export default router;
