import { Router } from 'express';
import { LawyerRegistrationController } from '../controllers/lawyer-registration.controller';

const router = Router();
const lawyerRegistrationController = new LawyerRegistrationController();

// Public routes (lawyer registration and verification)
router.post('/register', async (req, res) => {
  await lawyerRegistrationController.registerLawyer(req, res);
});

router.post('/verify-certificate', async (req, res) => {
  await lawyerRegistrationController.verifyCertificate(req, res);
});

// Admin routes (require authentication and admin role)
// TODO: Add auth middleware for admin-only routes

router.get('/admin/applications', async (req, res) => {
  // TODO: Add admin auth middleware
  await lawyerRegistrationController.getAllApplications(req, res);
});

router.get('/admin/applications/:id', async (req, res) => {
  // TODO: Add admin auth middleware
  await lawyerRegistrationController.getApplicationDetails(req, res);
});

router.put('/admin/applications/:id/approve', async (req, res) => {
  // TODO: Add admin auth middleware
  await lawyerRegistrationController.approveApplication(req, res);
});

router.put('/admin/applications/:id/reject', async (req, res) => {
  // TODO: Add admin auth middleware
  await lawyerRegistrationController.rejectApplication(req, res);
});

router.get('/admin/stats', async (req, res) => {
  // TODO: Add admin auth middleware
  await lawyerRegistrationController.getVerificationStats(req, res);
});

export default router;
