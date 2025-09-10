import { Router } from 'express';
import { AvailabilityController } from '../controllers/availability.controller';
import AuthMiddleware from '../middlewares/Auth.middleware';

const router = Router();
const availabilityController = new AvailabilityController();

// Get available lawyers for booking (public endpoint for clients)
router.get('/lawyers/available', availabilityController.getAvailableLawyers);

// Protected routes that require authentication
router.use(AuthMiddleware.authenticate);

// Lawyer availability management routes
router.post('/lawyer/:lawyerId/availability', availabilityController.createAvailability);
router.get('/lawyer/:lawyerId/availability', availabilityController.getLawyerAvailability);
router.post('/lawyer/:lawyerId/availability/recurring', availabilityController.createRecurringAvailability);
router.get('/lawyer/:lawyerId/appointments', availabilityController.getLawyerAppointments);

// Individual availability slot management
router.put('/availability/:availabilityId', availabilityController.updateAvailability);
router.delete('/availability/:availabilityId', availabilityController.deleteAvailability);

export default router;
