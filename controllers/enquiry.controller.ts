import { Request, Response } from 'express';
import prisma from '../prisma/prismaClient';

const VALID_STATUSES = ['NEW', 'UNDER_REVIEW', 'NEEDS_INFO', 'INVITED', 'REJECTED'] as const;

export class EnquiryController {
  /** Public: submit an enquiry. Rate-limited at the route. One pending per email. */
  async submit(req: Request, res: Response) {
    try {
      const { fullName, email, phone, firm, location, practiceAreas, barNumber, barAdmissionYear, message } = req.body;
      if (!fullName || !email) {
        return res.status(400).json({ success: false, message: 'fullName and email are required' });
      }
      const cleanEmail = String(email).trim().toLowerCase();
      const pending = await prisma.enquiry.findFirst({
        where: { email: cleanEmail, status: { in: ['NEW', 'UNDER_REVIEW', 'NEEDS_INFO'] } }
      });
      if (pending) {
        return res.status(200).json({
          success: true,
          message: 'You already have a pending enquiry',
          data: { refToken: pending.refToken, status: pending.status }
        });
      }
      const enquiry = await prisma.enquiry.create({
        data: {
          fullName: String(fullName).trim(),
          email: cleanEmail,
          phone: phone ? String(phone).trim() : null,
          firm: firm ? String(firm).trim() : null,
          location: location ? String(location).trim() : null,
          practiceAreas: Array.isArray(practiceAreas) ? practiceAreas.map(String) : [],
          barNumber: barNumber ? String(barNumber).trim() : null,
          barAdmissionYear: barAdmissionYear ? String(barAdmissionYear).trim() : null,
          message: message ? String(message).trim() : null
        }
      });
      return res.status(201).json({
        success: true,
        message: 'Enquiry received. Track it with your reference link.',
        data: { refToken: enquiry.refToken, status: enquiry.status }
      });
    } catch (error) {
      console.error('Error submitting enquiry:', error);
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }

  /** Public: track an enquiry by its secret refToken. */
  async track(req: Request, res: Response) {
    try {
      const refToken = String(req.query.ref || req.params.refToken || '');
      if (!refToken) return res.status(400).json({ success: false, message: 'ref is required' });
      const enquiry = await prisma.enquiry.findUnique({
        where: { refToken },
        select: { fullName: true, status: true, reviewNotes: true, updatedAt: true, createdAt: true }
      });
      if (!enquiry) return res.status(404).json({ success: false, message: 'Enquiry not found' });
      return res.status(200).json({ success: true, data: enquiry });
    } catch (error) {
      console.error('Error tracking enquiry:', error);
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }

  /** Admin: list enquiries with optional status filter. */
  async list(req: Request, res: Response) {
    try {
      const { status, search } = req.query;
      const where: any = {};
      if (status && status !== 'all') where.status = String(status).toUpperCase();
      if (search) {
        where.OR = [
          { fullName: { contains: String(search), mode: 'insensitive' } },
          { email: { contains: String(search), mode: 'insensitive' } },
          { firm: { contains: String(search), mode: 'insensitive' } }
        ];
      }
      const enquiries = await prisma.enquiry.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: 100,
        include: { invitation: { select: { id: true, status: true, expiresAt: true } } }
      });
      return res.status(200).json({ success: true, data: enquiries });
    } catch (error) {
      console.error('Error listing enquiries:', error);
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }

  /** Admin: update status / review notes. */
  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { status, reviewNotes } = req.body;
      if (status && !(VALID_STATUSES as readonly string[]).includes(String(status).toUpperCase())) {
        return res.status(400).json({ success: false, message: `status must be one of ${VALID_STATUSES.join(', ')}` });
      }
      const enquiry = await prisma.enquiry.update({
        where: { id },
        data: {
          ...(status ? { status: String(status).toUpperCase() as any } : {}),
          ...(reviewNotes !== undefined ? { reviewNotes: String(reviewNotes) } : {}),
          reviewedBy: req.user?.id,
          reviewedAt: new Date()
        }
      });
      return res.status(200).json({ success: true, data: enquiry });
    } catch (error) {
      console.error('Error updating enquiry:', error);
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }
}
