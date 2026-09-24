import { Request, Response } from 'express';
import { InvitationService } from '../services/invitation.service';

const invitationService = new InvitationService();

export class InvitationController {
  /** Admin: create an invitation (optionally from an enquiry). Returns raw token once. */
  async create(req: Request, res: Response) {
    try {
      const { email, name, enquiryId } = req.body;
      if (!email) return res.status(400).json({ success: false, message: 'email is required' });
      const { invitation, token } = await invitationService.create({
        email,
        name,
        enquiryId,
        invitedBy: req.user!.id
      });
      return res.status(201).json({ success: true, data: { invitation, token } });
    } catch (error: any) {
      console.error('Error creating invitation:', error);
      return res.status(error.status || 500).json({ success: false, message: error.message || 'Internal server error' });
    }
  }

  /** Admin: list invitations. */
  async list(req: Request, res: Response) {
    try {
      const data = await invitationService.list(req.query.status as string);
      return res.status(200).json({ success: true, data });
    } catch (error) {
      console.error('Error listing invitations:', error);
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }

  /** Public: validate a token (for the accept page). Returns email/name/expiry only. */
  async validate(req: Request, res: Response) {
    try {
      const result = await invitationService.validate(req.params.token);
      if (!result.ok) return res.status(400).json({ success: false, message: `Invitation ${result.reason.toLowerCase()}`, reason: result.reason });
      return res.status(200).json({ success: true, data: result.invitation });
    } catch (error) {
      console.error('Error validating invitation:', error);
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }

  /** Admin: revoke. */
  async revoke(req: Request, res: Response) {
    try {
      const data = await invitationService.revoke(req.params.id);
      return res.status(200).json({ success: true, data });
    } catch (error: any) {
      console.error('Error revoking invitation:', error);
      return res.status(error.status || 500).json({ success: false, message: error.message || 'Internal server error' });
    }
  }

  /** Admin: reissue (revokes old, creates fresh token). */
  async reissue(req: Request, res: Response) {
    try {
      const { invitation, token } = await invitationService.reissue(req.params.id, req.user!.id);
      return res.status(201).json({ success: true, data: { invitation, token } });
    } catch (error: any) {
      console.error('Error reissuing invitation:', error);
      return res.status(error.status || 500).json({ success: false, message: error.message || 'Internal server error' });
    }
  }
}
