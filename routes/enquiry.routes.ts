import { Router } from 'express';
import { EnquiryController } from '../controllers/enquiry.controller';
import { InvitationService } from '../services/invitation.service';
import { authenticate, authorize, rateLimit } from '../middlewares/Auth.middleware';

const router = Router();
const enquiryController = new EnquiryController();
const invitationService = new InvitationService();

// Public: submit an enquiry (tight rate limit — the door knocker)
router.post('/', rateLimit(3, 60 * 60 * 1000), enquiryController.submit.bind(enquiryController));

// Public: track by secret ref token
router.get('/status', enquiryController.track.bind(enquiryController));
router.get('/:refToken/status', enquiryController.track.bind(enquiryController));

// Admin: triage queue
router.get('/', authenticate, authorize('ADMIN'), enquiryController.list.bind(enquiryController));
router.patch('/:id', authenticate, authorize('ADMIN'), enquiryController.update.bind(enquiryController));

// Admin: approve an enquiry straight into an invitation (one click)
router.post(
  '/:id/invite',
  authenticate,
  authorize('ADMIN'),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { prisma } = await import('../prisma/prismaClient').then(m => ({ prisma: m.default }));
      const enquiry = await prisma.enquiry.findUnique({ where: { id } });
      if (!enquiry) return res.status(404).json({ success: false, message: 'Enquiry not found' });
      if (enquiry.invitationId) return res.status(400).json({ success: false, message: 'Enquiry already invited' });
      const { invitation, token } = await invitationService.create({
        email: enquiry.email,
        name: enquiry.fullName,
        enquiryId: enquiry.id,
        invitedBy: req.user!.id
      });
      return res.status(201).json({ success: true, data: { invitation, token } });
    } catch (error: any) {
      console.error('Error inviting enquiry:', error);
      return res.status(error.status || 500).json({ success: false, message: error.message || 'Internal server error' });
    }
  }
);

export default router;
