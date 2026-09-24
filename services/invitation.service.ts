import crypto from 'crypto';
import prisma from '../prisma/prismaClient';

export const INVITATION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function hashToken(raw: string): string {
  return crypto.createHash('sha256').update(raw).digest('hex');
}

export interface CreateInvitationInput {
  email: string;
  name?: string;
  invitedBy: string;
  enquiryId?: string;
  ttlMs?: number;
}

export class InvitationService {
  /** Create an invitation; returns the public object + raw token (shown once). */
  async create(input: CreateInvitationInput) {
    const raw = crypto.randomBytes(32).toString('hex');
    const invitation = await prisma.lawyerInvitation.create({
      data: {
        email: input.email.trim().toLowerCase(),
        name: input.name?.trim() || null,
        tokenHash: hashToken(raw),
        expiresAt: new Date(Date.now() + (input.ttlMs ?? INVITATION_TTL_MS)),
        invitedBy: input.invitedBy,
        ...(input.enquiryId ? { enquiry: { connect: { id: input.enquiryId } } } : {})
      }
    });
    if (input.enquiryId) {
      await prisma.enquiry.update({
        where: { id: input.enquiryId },
        data: { status: 'INVITED', invitationId: invitation.id, reviewedBy: input.invitedBy, reviewedAt: new Date() }
      });
    }
    return { invitation, token: raw };
  }

  /** Validate a raw token. Auto-expires stale PENDING invites. Never leaks other rows. */
  async validate(raw: string) {
    const invitation = await prisma.lawyerInvitation.findUnique({
      where: { tokenHash: hashToken(raw) }
    });
    if (!invitation) return { ok: false as const, reason: 'INVALID' };
    if (invitation.status === 'REVOKED') return { ok: false as const, reason: 'REVOKED' };
    if (invitation.status === 'ACCEPTED') return { ok: false as const, reason: 'USED' };
    if (invitation.expiresAt.getTime() < Date.now()) {
      if (invitation.status === 'PENDING') {
        await prisma.lawyerInvitation.update({ where: { id: invitation.id }, data: { status: 'EXPIRED' } });
      }
      return { ok: false as const, reason: 'EXPIRED' };
    }
    return {
      ok: true as const,
      invitation: { email: invitation.email, name: invitation.name, expiresAt: invitation.expiresAt }
    };
  }

  /** Consume a token during registration. Throws on any problem. Returns the invite row. */
  async consume(raw: string, email: string) {
    const invitation = await prisma.lawyerInvitation.findUnique({
      where: { tokenHash: hashToken(raw) }
    });
    if (!invitation) throw Object.assign(new Error('Invalid invitation'), { status: 400 });
    if (invitation.status === 'REVOKED') throw Object.assign(new Error('Invitation revoked'), { status: 400 });
    if (invitation.status === 'ACCEPTED') throw Object.assign(new Error('Invitation already used'), { status: 400 });
    if (invitation.status === 'EXPIRED' || invitation.expiresAt.getTime() < Date.now()) {
      if (invitation.status === 'PENDING') {
        await prisma.lawyerInvitation.update({ where: { id: invitation.id }, data: { status: 'EXPIRED' } });
      }
      throw Object.assign(new Error('Invitation expired'), { status: 400 });
    }
    if (invitation.email !== email.trim().toLowerCase()) {
      throw Object.assign(new Error('Email does not match invitation'), { status: 400 });
    }
    return await prisma.lawyerInvitation.update({
      where: { id: invitation.id },
      data: { status: 'ACCEPTED', usedAt: new Date() }
    });
  }

  async revoke(id: string) {
    return prisma.lawyerInvitation.update({
      where: { id },
      data: { status: 'REVOKED', revokedAt: new Date() }
    });
  }

  async reissue(id: string, invitedBy: string) {
    const prev = await prisma.lawyerInvitation.findUnique({ where: { id } });
    if (!prev) throw Object.assign(new Error('Invitation not found'), { status: 404 });
    if (prev.status === 'ACCEPTED') throw Object.assign(new Error('Already accepted'), { status: 400 });
    await prisma.lawyerInvitation.update({ where: { id }, data: { status: 'REVOKED', revokedAt: new Date() } });
    return this.create({ email: prev.email, name: prev.name || undefined, invitedBy });
  }

  async list(status?: string) {
    return prisma.lawyerInvitation.findMany({
      where: status && status !== 'all' ? { status: status.toUpperCase() as any } : {},
      orderBy: { createdAt: 'desc' },
      take: 100
    });
  }
}
