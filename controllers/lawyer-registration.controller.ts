import { Request, Response } from 'express';
import { LawyerVerificationService } from '../services/lawyer-verification.service';
import { verifyCertificate } from '../services/certificate.service';
import { prisma } from '../prisma/prismaClient';
import { hashPassword } from '../utils/bcrypt';
import { uploadLegalDocument, uploadVideoToS3, UploadResult } from '../utils/aws';

// S3 file upload function
const uploadFile = async (
  file: Express.Multer.File, 
  documentType: string = 'general', 
  lawyerId?: string
): Promise<string> => {
  try {
    let result: UploadResult;
    
    // Check if it's a video file
    const isVideo = file.mimetype.startsWith('video/');
    
    if (isVideo) {
      result = await uploadVideoToS3(
        file.buffer,
        file.originalname,
        'lawyer-videos',
        file.mimetype
      );
    } else if (lawyerId) {
      // Upload legal document with organized structure
      result = await uploadLegalDocument(
        file.buffer,
        file.originalname,
        documentType,
        lawyerId,
        file.mimetype
      );
    } else {
      // Fallback for general uploads
      const { uploadFileToS3 } = await import('../utils/aws');
      result = await uploadFileToS3(
        file.buffer,
        file.originalname,
        'temp-uploads',
        file.mimetype
      );
    }
    
    if (!result.success) {
      throw new Error(result.error || 'Upload failed');
    }
    
    return result.url!;
  } catch (error) {
    console.error('File upload error:', error);
    throw new Error('Failed to upload file to S3');
  }
};

export class LawyerRegistrationController {
  private lawyerVerificationService: LawyerVerificationService;

  constructor() {
    this.lawyerVerificationService = new LawyerVerificationService();
  }

  // Register a new lawyer with automatic verification
  async registerLawyer(req: Request, res: Response) {
    console.log('🔍 Registration request received:', {
      body: req.body,
      headers: req.headers['content-type']
    });
    
    try {
      const {
        fullName,
        email,
        password,
        firm,
        location,
        certificateNumber,
        barAdmissionYear,
        experience,
        education,
        practiceAreas,
        specializations,
        languages,
        website,
        professionalSummary
      } = req.body;

      console.log('🔍 Extracted data:', {
        fullName,
        email,
        firm,
        location
      });

      // Validate required fields
      if (!fullName || !email || !password || !firm) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: fullName, email, password, firm'
        });
      }

      // Check if lawyer already exists
      const existingUser = await prisma.user.findUnique({
        where: { email }
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'A user with this email already exists'
        });
      }

      // Verify certificate automatically if provided
      let certificateVerificationResult: {
        isVerified: boolean;
        message: string;
        matchedCertificate: any;
        confidence: number;
      } | null = null;
      let isVerified = false;
      if (certificateNumber) {
        try {
          console.log(`🔍 Verifying certificate: ${certificateNumber}`);
          isVerified = await verifyCertificate(
            fullName,
            barAdmissionYear || new Date().getFullYear().toString(),
            certificateNumber
          );
          certificateVerificationResult = {
            isVerified,
            message: isVerified ? 'Certificate verified successfully' : 'Certificate not found or does not match',
            matchedCertificate: null,
            confidence: isVerified ? 100 : 0
          };
        } catch (error) {
          console.error('Certificate verification error:', error);
          certificateVerificationResult = {
            isVerified: false,
            message: 'Certificate verification failed',
            matchedCertificate: null,
            confidence: 0
          };
          isVerified = false;
        }
      }

      // Hash password
      const hashedPassword = await hashPassword(password);

      // Create user account
      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          fullName,
          role: 'LAWYER',
          isVerified: false, // Will be set to true after admin approval
          status: 'PENDING_VERIFICATION'
        }
      });

      // Create lawyer profile
      const lawyer = await prisma.lawyer.create({
        data: {
          userId: user.id,
          firm,
          location,
          barAdmissionYear,
          experience: experience ? parseInt(experience) : null,
          education,
          practiceAreas: Array.isArray(practiceAreas) ? practiceAreas : [],
          specializations: Array.isArray(specializations) ? specializations : (specializations ? [specializations] : []),
          languages: Array.isArray(languages) ? languages : (languages ? [languages] : []),
          website,
          professionalSummary,
          certificateNumber,
          certificateVerified: isVerified,
          verificationStatus: isVerified ? 'APPROVED' : 'PENDING'
        }
      });

      // Parse bar admission date safely
      let certificateIssueDate: Date | undefined = undefined;
      if (barAdmissionYear) {
        try {
          // Handle different date formats
          if (/^\d{4}$/.test(barAdmissionYear)) {
            // Just a year (e.g., "2015")
            certificateIssueDate = new Date(`${barAdmissionYear}-01-01`);
          } else if (/^\d{2}\/\d{2}\/\d{4}$/.test(barAdmissionYear)) {
            // DD/MM/YYYY format
            const [day, month, year] = barAdmissionYear.split('/');
            certificateIssueDate = new Date(`${year}-${month}-${day}`);
          } else {
            // Try parsing as-is
            certificateIssueDate = new Date(barAdmissionYear);
            if (isNaN(certificateIssueDate.getTime())) {
              certificateIssueDate = undefined;
            }
          }
        } catch (error) {
          console.warn('Failed to parse bar admission date:', barAdmissionYear);
          certificateIssueDate = undefined;
        }
      }

      // Create verification record
      console.log('🔍 Creating verification record for lawyer:', lawyer.id);
      const verification = await this.lawyerVerificationService.createVerification({
        lawyerId: lawyer.id,
        certificateVerified: isVerified,
        certificateNumber,
        certificateName: fullName,
        certificateIssueDate,
        certificateMatchScore: isVerified ? 100 : 0
      });
      console.log('✅ Verification record created:', verification.id);

      // If certificate is automatically verified, approve the lawyer
      if (isVerified) {
        console.log('🔍 Auto-approving verified lawyer:', fullName);
        await prisma.user.update({
          where: { id: user.id },
          data: { 
            isVerified: true,
            status: 'ACTIVE'
          }
        });

        await prisma.lawyer.update({
          where: { id: lawyer.id },
          data: { 
            verificationStatus: 'APPROVED',
            isVerified: true,
            verifiedAt: new Date()
          }
        });

        await this.lawyerVerificationService.approveVerification(lawyer.id, 'SYSTEM_AUTO_APPROVAL', 'Auto-approved based on certificate verification');
        
        console.log(`✅ Auto-verified and approved lawyer: ${fullName}`);
      }

      return res.status(201).json({
        success: true,
        message: isVerified 
          ? 'Registration successful! Your account has been verified and approved.'
          : 'Registration submitted successfully. Your application is under review.',
        data: {
          userId: user.id,
          lawyerId: lawyer.id,
          verificationId: verification.id,
          isAutoVerified: isVerified,
          verificationResult: certificateVerificationResult,
          user: {
            id: user.id,
            email: user.email,
            fullName: user.fullName,
            isVerified: user.isVerified,
            status: user.status
          }
        }
      });

    } catch (error) {
      console.error('Error in lawyer registration:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error during registration',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      });
    }
  }

  // Verify certificate only (for frontend validation)
  async verifyCertificate(req: Request, res: Response) {
    try {
      const { certificateNumber, fullName, barAdmissionYear } = req.body;

      if (!certificateNumber) {
        return res.status(400).json({
          success: false,
          message: 'Certificate number is required'
        });
      }

      console.log(`🔍 Certificate verification request: ${certificateNumber}`);
      const isVerified = await verifyCertificate(
        fullName || 'Unknown',
        barAdmissionYear || new Date().getFullYear().toString(),
        certificateNumber
      );

      const verificationResult = {
        isVerified,
        message: isVerified ? 'Certificate verified successfully' : 'Certificate not found or does not match',
        matchedCertificate: null,
        confidence: isVerified ? 100 : 0
      };

      return res.status(200).json({
        success: true,
        data: verificationResult
      });

    } catch (error) {
      console.error('Error in certificate verification:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error during verification',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      });
    }
  }

  // Get all lawyer applications (admin only)
  async getAllApplications(req: Request, res: Response) {
    try {
      const { status, search, page = 1, limit = 10 } = req.query;

      const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
      const take = parseInt(limit as string);

      let where: any = {};

      if (status && status !== 'all') {
        where.verificationStatus = status.toString().toUpperCase();
      }

      if (search) {
        where.OR = [
          { user: { fullName: { contains: search as string, mode: 'insensitive' } } },
          { user: { email: { contains: search as string, mode: 'insensitive' } } },
          { certificateNumber: { contains: search as string, mode: 'insensitive' } },
          { firm: { contains: search as string, mode: 'insensitive' } }
        ];
      }

      const [lawyers, total] = await Promise.all([
        prisma.lawyer.findMany({
          where,
          skip,
          take,
          include: {
            user: {
              select: {
                id: true,
                email: true,
                fullName: true,
                isVerified: true,
                status: true,
                createdAt: true
              }
            },
            verification: true
          },
          orderBy: { verifiedAt: 'desc' }
        }),
        prisma.lawyer.count({ where })
      ]);

      return res.status(200).json({
        success: true,
        data: {
          applications: lawyers,
          pagination: {
            page: parseInt(page as string),
            limit: parseInt(limit as string),
            total,
            pages: Math.ceil(total / parseInt(limit as string))
          }
        }
      });

    } catch (error) {
      console.error('Error fetching applications:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      });
    }
  }

  // Approve a lawyer application (admin only)
  async approveApplication(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { adminNotes } = req.body;

      const lawyer = await prisma.lawyer.findUnique({
        where: { id },
        include: { user: true, verification: true }
      });

      if (!lawyer) {
        return res.status(404).json({
          success: false,
          message: 'Lawyer application not found'
        });
      }

      if (lawyer.verificationStatus === 'APPROVED') {
        return res.status(400).json({
          success: false,
          message: 'Application is already approved'
        });
      }

      // Update user status
      await prisma.user.update({
        where: { id: lawyer.userId },
        data: {
          isVerified: true,
          status: 'ACTIVE'
        }
      });

      // Update lawyer status
      const updatedLawyer = await prisma.lawyer.update({
        where: { id },
        data: {
          verificationStatus: 'APPROVED',
          isVerified: true,
          verifiedAt: new Date()
        },
        include: {
          user: true,
          verification: true
        }
      });

      // Update verification record if exists
      if (lawyer.verification) {
        await this.lawyerVerificationService.approveVerification(
          lawyer.id, 
          'ADMIN_USER_ID', // TODO: Get actual admin user ID from request
          adminNotes || 'MANUALLY_APPROVED'
        );
      }

      console.log(`✅ Manually approved lawyer: ${lawyer.user.fullName}`);
      // TODO: Send approval email to lawyer

      return res.status(200).json({
        success: true,
        message: 'Application approved successfully',
        data: updatedLawyer
      });

    } catch (error) {
      console.error('Error approving application:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      });
    }
  }

  // Reject a lawyer application (admin only)
  async rejectApplication(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { reason, adminNotes } = req.body;

      const lawyer = await prisma.lawyer.findUnique({
        where: { id },
        include: { user: true, verification: true }
      });

      if (!lawyer) {
        return res.status(404).json({
          success: false,
          message: 'Lawyer application not found'
        });
      }

      if (lawyer.verificationStatus === 'REJECTED') {
        return res.status(400).json({
          success: false,
          message: 'Application is already rejected'
        });
      }

      // Update lawyer status
      const updatedLawyer = await prisma.lawyer.update({
        where: { id },
        data: {
          verificationStatus: 'REJECTED',
          isVerified: false
        },
        include: {
          user: true,
          verification: true
        }
      });

      // Update verification record if exists
      if (lawyer.verification) {
        await this.lawyerVerificationService.rejectVerification(
          lawyer.id,
          'ADMIN_USER_ID', // TODO: Get actual admin user ID from request
          reason || adminNotes || 'MANUALLY_REJECTED',
          adminNotes
        );
      }

      // TODO: Send rejection email to lawyer

      return res.status(200).json({
        success: true,
        message: 'Application rejected',
        data: updatedLawyer
      });

    } catch (error) {
      console.error('Error rejecting application:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      });
    }
  }

  // Get application details (admin only)
  async getApplicationDetails(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const lawyer = await prisma.lawyer.findUnique({
        where: { id },
        include: {
          user: true,
          verification: true
        }
      });

      if (!lawyer) {
        return res.status(404).json({
          success: false,
          message: 'Lawyer application not found'
        });
      }

      return res.status(200).json({
        success: true,
        data: lawyer
      });

    } catch (error) {
      console.error('Error fetching application details:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      });
    }
  }

  // Get verification statistics (admin only)
  async getVerificationStats(req: Request, res: Response) {
    try {
      const [pending, approved, rejected, underReview] = await Promise.all([
        prisma.lawyer.count({ where: { verificationStatus: 'PENDING' } }),
        prisma.lawyer.count({ where: { verificationStatus: 'APPROVED' } }),
        prisma.lawyer.count({ where: { verificationStatus: 'REJECTED' } }),
        prisma.lawyer.count({ where: { verificationStatus: 'UNDER_REVIEW' } })
      ]);

      const total = pending + approved + rejected + underReview;

      return res.status(200).json({
        success: true,
        data: {
          total,
          pending,
          verified: approved,
          rejected,
          underReview,
          verificationRate: total > 0 ? Math.round((approved / total) * 100) : 0
        }
      });

    } catch (error) {
      console.error('Error fetching verification stats:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      });
    }
  }
}
