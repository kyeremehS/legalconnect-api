import { Request, Response } from 'express';
import { LawyerVerificationService } from '../services/lawyer-verification.service';

export class AdminVerificationController {
  private verificationService = new LawyerVerificationService();

  // Get all pending verifications
  getPendingVerifications = async (req: Request, res: Response) => {
    try {
      // Check if user is admin
      if (req.user?.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Access denied. Admin role required.' });
      }

      const verifications = await this.verificationService.getAllPendingVerifications();
      
      res.json({
        success: true,
        data: verifications,
        count: verifications.length
      });
    } catch (error) {
      console.error('Error getting pending verifications:', error);
      res.status(500).json({ error: 'Failed to get pending verifications' });
    }
  };

  // Get verification statistics
  getVerificationStats = async (req: Request, res: Response) => {
    try {
      // Check if user is admin
      if (req.user?.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Access denied. Admin role required.' });
      }

      const stats = await this.verificationService.getVerificationStats();
      
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Error getting verification stats:', error);
      res.status(500).json({ error: 'Failed to get verification statistics' });
    }
  };

  // Approve lawyer verification
  approveVerification = async (req: Request, res: Response) => {
    try {
      // Check if user is admin
      if (req.user?.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Access denied. Admin role required.' });
      }

      const { lawyerId } = req.params;
      const { adminNotes } = req.body;
      const adminUserId = req.user.id;

      const verification = await this.verificationService.approveVerification(
        lawyerId,
        adminUserId,
        adminNotes
      );

      res.json({
        success: true,
        message: 'Lawyer verification approved successfully',
        data: verification
      });
    } catch (error) {
      console.error('Error approving verification:', error);
      res.status(500).json({ error: 'Failed to approve verification' });
    }
  };

  // Reject lawyer verification
  rejectVerification = async (req: Request, res: Response) => {
    try {
      // Check if user is admin
      if (req.user?.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Access denied. Admin role required.' });
      }

      const { lawyerId } = req.params;
      const { rejectionReason, adminNotes } = req.body;
      const adminUserId = req.user.id;

      if (!rejectionReason) {
        return res.status(400).json({ error: 'Rejection reason is required' });
      }

      const verification = await this.verificationService.rejectVerification(
        lawyerId,
        adminUserId,
        rejectionReason,
        adminNotes
      );

      res.json({
        success: true,
        message: 'Lawyer verification rejected',
        data: verification
      });
    } catch (error) {
      console.error('Error rejecting verification:', error);
      res.status(500).json({ error: 'Failed to reject verification' });
    }
  };

  // Require resubmission
  requireResubmission = async (req: Request, res: Response) => {
    try {
      // Check if user is admin
      if (req.user?.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Access denied. Admin role required.' });
      }

      const { lawyerId } = req.params;
      const { rejectionReason, adminNotes } = req.body;
      const adminUserId = req.user.id;

      if (!rejectionReason) {
        return res.status(400).json({ error: 'Rejection reason is required' });
      }

      const verification = await this.verificationService.requireResubmission(
        lawyerId,
        adminUserId,
        rejectionReason,
        adminNotes
      );

      res.json({
        success: true,
        message: 'Resubmission required',
        data: verification
      });
    } catch (error) {
      console.error('Error requiring resubmission:', error);
      res.status(500).json({ error: 'Failed to require resubmission' });
    }
  };

  // Get specific verification details
  getVerificationDetails = async (req: Request, res: Response) => {
    try {
      // Check if user is admin
      if (req.user?.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Access denied. Admin role required.' });
      }

      const { lawyerId } = req.params;

      const verification = await this.verificationService.getVerificationByLawyerId(lawyerId);
      
      if (!verification) {
        return res.status(404).json({ error: 'Verification record not found' });
      }

      res.json({
        success: true,
        data: verification
      });
    } catch (error) {
      console.error('Error getting verification details:', error);
      res.status(500).json({ error: 'Failed to get verification details' });
    }
  };
}
