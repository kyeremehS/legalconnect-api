import { Router } from 'express';
import { AvailabilityController } from '../controllers/availability.controller';
import AuthMiddleware from '../middlewares/Auth.middleware';

const router = Router();
const availabilityController = new AvailabilityController();

// Get available lawyers for booking (public endpoint for clients)
router.get('/lawyers/available', availabilityController.getAvailableLawyers);

// Testing endpoints
router.get('/testing/lawyers', availabilityController.getAllLawyers);
router.get('/testing/appointments', availabilityController.debugAllAppointments);
router.get('/testing/user-lawyer-info', AuthMiddleware.authenticate, availabilityController.debugUserLawyerInfo);
router.post('/testing/verify-lawyer/:lawyerId', availabilityController.verifyLawyerForTesting);

// Protected routes that require authentication
router.use(AuthMiddleware.authenticate);

// Get current lawyer's availability slots (using auth token)
router.get('/lawyer/my-availability', availabilityController.getMyAvailability);

// Create availability for current lawyer (using auth token)
router.post('/lawyer/my-availability', availabilityController.createMyAvailability);

// Lawyer availability management routes
router.post('/lawyer/:lawyerId/availability', availabilityController.createAvailability);
router.get('/lawyer/:lawyerId/availability', availabilityController.getLawyerAvailability);
router.post('/lawyer/:lawyerId/availability/recurring', availabilityController.createRecurringAvailability);
router.get('/lawyer/:lawyerId/appointments', availabilityController.getLawyerAppointments);

// Individual availability slot management
router.put('/availability/:availabilityId', availabilityController.updateAvailability);
router.delete('/availability/:availabilityId', availabilityController.deleteAvailability);

export default router;
