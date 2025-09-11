import { Router } from 'express';
import { DashboardController } from '../controllers/dashboard.controller';

const router = Router();
const dashboardController = new DashboardController();

/**
 * @route GET /api/dashboard/user/:userId
 * @desc Get user dashboard data including appointments, messages, videos, and statistics
 * @access Private
 */
router.get('/user/:userId', dashboardController.getUserDashboardData.bind(dashboardController));

export default router;
