import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface CreateVerificationData {
  lawyerId: string;
  certificateVerified?: boolean;
  certificateNumber?: string;
  certificateName?: string;
  certificateIssueDate?: Date;
  certificateMatchScore?: number;
}

export interface UpdateCertificateVerificationData {
  certificateVerified: boolean;
  certificateNumber?: string;
  certificateName?: string;
  certificateIssueDate?: Date;
  certificateMatchScore?: number;
}

export class LawyerVerificationService {
  
  async createVerification(data: CreateVerificationData) {
    try {
      const verification = await prisma.lawyerVerification.create({
        data: {
          lawyerId: data.lawyerId,
          certificateVerified: data.certificateVerified || false,
          certificateNumber: data.certificateNumber,
          certificateName: data.certificateName,
          certificateIssueDate: data.certificateIssueDate,
          certificateMatchScore: data.certificateMatchScore,
          documentsSubmitted: [] as any,
          documentsVerified: [] as any,
          documentsRejected: [] as any
        },
        include: {
          lawyer: {
            include: {
              user: true
            }
          }
        }
      });

      return verification;
    } catch (error) {
      console.error('Error creating verification:', error);
      throw new Error('Failed to create verification record');
    }
  }

  async getVerificationByLawyerId(lawyerId: string) {
    try {
      const verification = await prisma.lawyerVerification.findUnique({
        where: { lawyerId },
        include: {
          lawyer: {
            include: {
              user: true
            }
          }
        }
      });

      return verification;
    } catch (error) {
      console.error('Error getting verification:', error);
      throw new Error('Failed to get verification record');
    }
  }

  async updateVerificationDocuments(lawyerId: string, documentsSubmitted: string[]) {
    try {
      const verification = await prisma.lawyerVerification.update({
        where: { lawyerId },
        data: {
          documentsSubmitted: documentsSubmitted as any,
          status: 'UNDER_REVIEW',
          updatedAt: new Date()
        },
        include: {
          lawyer: {
            include: {
              user: true
            }
          }
        }
      });

      // Update lawyer status to under review
      await prisma.lawyer.update({
        where: { id: lawyerId },
        data: {
          verificationStatus: 'UNDER_REVIEW'
        }
      });

      return verification;
    } catch (error) {
      console.error('Error updating verification documents:', error);
      throw new Error('Failed to update verification documents');
    }
  }

  async updateCertificateVerification(lawyerId: string, data: UpdateCertificateVerificationData) {
    try {
      const verification = await prisma.lawyerVerification.update({
        where: { lawyerId },
        data: {
          certificateVerified: data.certificateVerified,
          certificateNumber: data.certificateNumber,
          certificateName: data.certificateName,
          certificateIssueDate: data.certificateIssueDate,
          certificateMatchScore: data.certificateMatchScore,
          updatedAt: new Date()
        },
        include: {
          lawyer: {
            include: {
              user: true
            }
          }
        }
      });

      return verification;
    } catch (error) {
      console.error('Error updating certificate verification:', error);
      throw new Error('Failed to update certificate verification');
    }
  }

  async resubmitVerification(lawyerId: string, notes?: string) {
    try {
      const verification = await prisma.lawyerVerification.update({
        where: { lawyerId },
        data: {
          status: 'PENDING',
          resubmissionCount: { increment: 1 },
          lastResubmissionAt: new Date(),
          adminNotes: notes,
          updatedAt: new Date()
        }
      });

      // Update lawyer status
      await prisma.lawyer.update({
        where: { id: lawyerId },
        data: {
          verificationStatus: 'PENDING'
        }
      });

      return verification;
    } catch (error) {
      console.error('Error resubmitting verification:', error);
      throw new Error('Failed to resubmit verification');
    }
  }

  // Admin methods
  async getAllPendingVerifications() {
    try {
      const verifications = await prisma.lawyerVerification.findMany({
        where: {
          status: { in: ['PENDING', 'UNDER_REVIEW'] }
        },
        include: {
          lawyer: {
            include: {
              user: true
            }
          }
        },
        orderBy: {
          submittedAt: 'asc'
        }
      });

      return verifications;
    } catch (error) {
      console.error('Error getting pending verifications:', error);
      throw new Error('Failed to get pending verifications');
    }
  }

  async approveVerification(lawyerId: string, adminUserId: string, adminNotes?: string) {
    try {
      const verification = await prisma.lawyerVerification.update({
        where: { lawyerId },
        data: {
          status: 'APPROVED',
          reviewedAt: new Date(),
          reviewedBy: adminUserId,
          adminNotes,
          updatedAt: new Date()
        }
      });

      // Update lawyer status
      await prisma.lawyer.update({
        where: { id: lawyerId },
        data: {
          verificationStatus: 'APPROVED',
          isVerified: true,
          verifiedAt: new Date()
        }
      });

      return verification;
    } catch (error) {
      console.error('Error approving verification:', error);
      throw new Error('Failed to approve verification');
    }
  }

  async rejectVerification(lawyerId: string, adminUserId: string, rejectionReason: string, adminNotes?: string) {
    try {
      const verification = await prisma.lawyerVerification.update({
        where: { lawyerId },
        data: {
          status: 'REJECTED',
          reviewedAt: new Date(),
          reviewedBy: adminUserId,
          rejectionReason,
          adminNotes,
          updatedAt: new Date()
        }
      });

      // Update lawyer status
      await prisma.lawyer.update({
        where: { id: lawyerId },
        data: {
          verificationStatus: 'REJECTED',
          isVerified: false
        }
      });

      return verification;
    } catch (error) {
      console.error('Error rejecting verification:', error);
      throw new Error('Failed to reject verification');
    }
  }

  async requireResubmission(lawyerId: string, adminUserId: string, rejectionReason: string, adminNotes?: string) {
    try {
      const verification = await prisma.lawyerVerification.update({
        where: { lawyerId },
        data: {
          status: 'RESUBMISSION_REQUIRED',
          reviewedAt: new Date(),
          reviewedBy: adminUserId,
          rejectionReason,
          adminNotes,
          updatedAt: new Date()
        }
      });

      // Update lawyer status
      await prisma.lawyer.update({
        where: { id: lawyerId },
        data: {
          verificationStatus: 'RESUBMISSION_REQUIRED'
        }
      });

      return verification;
    } catch (error) {
      console.error('Error requiring resubmission:', error);
      throw new Error('Failed to require resubmission');
    }
  }

  async getVerificationStats() {
    try {
      const stats = await prisma.lawyerVerification.groupBy({
        by: ['status'],
        _count: {
          status: true
        }
      });

      const total = await prisma.lawyerVerification.count();

      return {
        total,
        byStatus: stats.reduce((acc: Record<string, number>, stat: any) => {
          acc[stat.status] = stat._count.status;
          return acc;
        }, {} as Record<string, number>)
      };
    } catch (error) {
      console.error('Error getting verification stats:', error);
      throw new Error('Failed to get verification statistics');
    }
  }
}
