import { Router } from 'express';
import { AppointmentController } from '../controllers/appointment.controller';
import { authenticate, authorize } from '../middlewares/Auth.middleware';
import { validateSchema } from '../middlewares/validation.middleware';
import { z } from 'zod';

const router = Router();
const appointmentController = new AppointmentController();

// Zod validation schemas
const createAppointmentSchema = z.object({
  lawyerId: z.string().min(1, 'Lawyer ID is required'),
  title: z.string().optional(),
  startTime: z.string().datetime('Valid start time is required'),
  endTime: z.string().datetime('Valid end time is required'),
  practiceArea: z.string().optional(),
  description: z.string().optional(),
  meetingType: z.enum(['VIRTUAL', 'IN_PERSON', 'PHONE']).optional(),
  duration: z.string().optional()
});

const updateStatusSchema = z.object({
  status: z.enum(['PENDING', 'SCHEDULED', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'NO_SHOW']),
  notes: z.string().optional()
});

const availabilitySchema = z.array(z.object({
  dayOfWeek: z.number().min(0).max(6),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Valid time format required (HH:MM)'),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Valid time format required (HH:MM)'),
  isActive: z.boolean()
}));

// Routes

// Create appointment (Client only)
router.post('/', 
  authenticate, 
  authorize('CLIENT'), 
  validateSchema(createAppointmentSchema),
  appointmentController.createAppointment.bind(appointmentController)
);

// Update appointment status (Lawyer/Admin only)
router.put('/:id/status', 
  authenticate, 
  authorize('LAWYER', 'ADMIN'), 
  validateSchema(updateStatusSchema),
  appointmentController.updateAppointmentStatus.bind(appointmentController)
);

// Get lawyer's appointments (Lawyer/Admin only)
router.get('/lawyer', 
  authenticate, 
  authorize('LAWYER', 'ADMIN'),
  appointmentController.getLawyerAppointments.bind(appointmentController)
);

// Get client's appointments (Client only)
router.get('/client', 
  authenticate, 
  authorize('CLIENT'),
  appointmentController.getClientAppointments.bind(appointmentController)
);

// Testing endpoint for client appointments (no role restriction)
router.get('/testing/client-appointments', 
  authenticate,
  appointmentController.getClientAppointments.bind(appointmentController)
);

// Update appointment status with PATCH method (lawyers only)
router.patch('/:id/status', 
  authenticate, 
  authorize('LAWYER', 'ADMIN'), 
  validateSchema(updateStatusSchema),
  appointmentController.updateAppointmentStatus.bind(appointmentController)
);

// Client cancellation endpoint (clients can only cancel their own appointments)
router.patch('/:id/cancel', 
  authenticate, 
  authorize('CLIENT'), 
  appointmentController.cancelClientAppointment.bind(appointmentController)
);

// Get lawyer availability (Public)
router.get('/lawyer/:lawyerId/availability', 
  appointmentController.getLawyerAvailability.bind(appointmentController)
);

// Set lawyer availability (Lawyer/Admin only)
router.post('/lawyer/availability', 
  authenticate, 
  authorize('LAWYER', 'ADMIN'), 
  validateSchema(availabilitySchema),
  appointmentController.setLawyerAvailability.bind(appointmentController)
);

// Get appointment notifications for lawyer (Lawyer/Admin only)
router.get('/notifications', 
  authenticate, 
  authorize('LAWYER', 'ADMIN'),
  appointmentController.getAppointmentNotifications.bind(appointmentController)
);

// Get appointment by ID (Authenticated users)
router.get('/:id', 
  authenticate,
  appointmentController.getAppointment.bind(appointmentController)
);

// Get user notifications (Authenticated users)
router.get('/user/notifications', 
  authenticate,
  appointmentController.getNotifications.bind(appointmentController)
);

// Mark notification as read (Authenticated users)
router.put('/notifications/:id/read', 
  authenticate,
  appointmentController.markNotificationAsRead.bind(appointmentController)
);

// Get lawyer dashboard statistics (Lawyer only)
router.get('/lawyer/stats', 
  authenticate, 
  authorize('LAWYER'),
  appointmentController.getLawyerStats.bind(appointmentController)
);

// Get lawyer recent activities (Lawyer only)
router.get('/lawyer/recent-activities', 
  authenticate, 
  authorize('LAWYER'),
  appointmentController.getLawyerRecentActivities.bind(appointmentController)
);

export default router;
