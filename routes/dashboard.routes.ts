import { Router } from 'express';
import { DashboardController } from '../controllers/dashboard.controller';
import { authenticate } from '../middlewares/Auth.middleware';

const router = Router();
const dashboardController = new DashboardController();

/**
 * @route GET /api/dashboard/user/:userId
 * @desc Get user dashboard data including appointments, messages, videos, and statistics
 * @access Private (owner or admin)
 */
router.get(
  '/user/:userId',
  authenticate,
  (req, res, next) => {
    if (req.user?.role !== 'ADMIN' && req.user?.id !== req.params.userId) {
      res.status(403).json({ success: false, message: 'Access denied. You can only access your own dashboard' });
      return;
    }
    next();
  },
  dashboardController.getUserDashboardData.bind(dashboardController)
);

export default router;
