import { Router } from 'express';
import { InvitationController } from '../controllers/invitation.controller';
import { authenticate, authorize } from '../middlewares/Auth.middleware';

const router = Router();
const invitationController = new InvitationController();

// Public: validate a token for the accept page (email/name/expiry only)
router.get('/validate/:token', invitationController.validate.bind(invitationController));

// Admin
router.post('/', authenticate, authorize('ADMIN'), invitationController.create.bind(invitationController));
router.get('/', authenticate, authorize('ADMIN'), invitationController.list.bind(invitationController));
router.post('/:id/revoke', authenticate, authorize('ADMIN'), invitationController.revoke.bind(invitationController));
router.post('/:id/reissue', authenticate, authorize('ADMIN'), invitationController.reissue.bind(invitationController));

export default router;
