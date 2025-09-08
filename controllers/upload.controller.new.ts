import { Request, Response } from 'express';
import { UploadService } from '../services/upload.service';
import { prisma } from '../prisma/prismaClient';

export class UploadController {
  private uploadService: UploadService;

  constructor() {
    this.uploadService = new UploadService();
  }

  /**
   * Upload lawyer documents to S3
   */
  async uploadLawyerDocuments(req: Request, res: Response) {
    try {
      const { lawyerId } = req.params;
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };

      console.log('📁 Upload request for lawyer:', lawyerId);
      console.log('📁 Files received:', Object.keys(files));

      if (!lawyerId) {
        return res.status(400).json({
          success: false,
          message: 'Lawyer ID is required'
        });
      }

      // Verify lawyer exists
      const lawyer = await prisma.lawyer.findUnique({
        where: { id: lawyerId }
      });

      if (!lawyer) {
        return res.status(404).json({
          success: false,
          message: 'Lawyer not found'
        });
      }

      if (!files || Object.keys(files).length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No files provided for upload'
        });
      }

      // Process uploads
      const uploadResults = await this.uploadService.uploadLawyerDocuments(files, lawyerId);

      // Update lawyer record with document URLs
      const updateData: any = {};
      Object.entries(uploadResults.urls).forEach(([key, value]) => {
        if (value) {
          updateData[key] = value;
        }
      });

      if (Object.keys(updateData).length > 0) {
        await prisma.lawyer.update({
          where: { id: lawyerId },
          data: updateData
        });

        console.log('✅ Lawyer documents updated in database');
      }

      return res.status(200).json({
        success: true,
        message: 'Documents uploaded successfully',
        data: {
          uploadedFiles: uploadResults.uploadedFiles,
          urls: uploadResults.urls,
          failed: uploadResults.failed
        }
      });

    } catch (error) {
      console.error('❌ Document upload error:', error);
      return res.status(500).json({
        success: false,
        message: 'Document upload failed',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  }

  /**
   * Upload a single document
   */
  async uploadSingleDocument(req: Request, res: Response) {
    try {
      const { lawyerId, documentType } = req.params;
      const file = req.file;

      if (!file) {
        return res.status(400).json({
          success: false,
          message: 'No file provided'
        });
      }

      if (!lawyerId || !documentType) {
        return res.status(400).json({
          success: false,
          message: 'Lawyer ID and document type are required'
        });
      }

      // Verify lawyer exists
      const lawyer = await prisma.lawyer.findUnique({
        where: { id: lawyerId }
      });

      if (!lawyer) {
        return res.status(404).json({
          success: false,
          message: 'Lawyer not found'
        });
      }

      // Upload document to S3
      const uploadResult = await this.uploadService.uploadSingleDocument(file, documentType, lawyerId);

      if (!uploadResult.success) {
        return res.status(500).json({
          success: false,
          message: 'Upload failed',
          error: uploadResult.error
        });
      }

      // Update lawyer record based on document type
      const updateData: any = {};
      
      switch (documentType) {
        case 'bar-certificate':
          updateData.barCertificateUrl = uploadResult.url;
          break;
        case 'practicing-certificate':
          updateData.practicingCertificateUrl = uploadResult.url;
          break;
        case 'id-document':
          updateData.idDocumentUrl = uploadResult.url;
          break;
        case 'cv-resume':
          updateData.cvResumeUrl = uploadResult.url;
          break;
        case 'law-degree':
          updateData.lawDegreeUrl = uploadResult.url;
          break;
        case 'video-intro':
        case 'profile-photo':
        default:
          updateData.otherDocumentUrl = uploadResult.url;
          break;
      }

      await prisma.lawyer.update({
        where: { id: lawyerId },
        data: updateData
      });

      return res.status(200).json({
        success: true,
        message: 'Document uploaded successfully',
        data: {
          documentType,
          url: uploadResult.url,
          key: uploadResult.key
        }
      });

    } catch (error) {
      console.error('❌ Single document upload error:', error);
      return res.status(500).json({
        success: false,
        message: 'Document upload failed',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  }

  /**
   * Upload video introduction
   */
  async uploadVideoIntro(req: Request, res: Response) {
    try {
      const { lawyerId } = req.params;
      const file = req.file;

      if (!file) {
        return res.status(400).json({
          success: false,
          message: 'No video file provided'
        });
      }

      if (!lawyerId) {
        return res.status(400).json({
          success: false,
          message: 'Lawyer ID is required'
        });
      }

      // Check if lawyer exists
      const lawyer = await prisma.lawyer.findUnique({
        where: { id: lawyerId }
      });

      if (!lawyer) {
        return res.status(404).json({
          success: false,
          message: 'Lawyer not found'
        });
      }

      // Upload video to S3
      const uploadResult = await this.uploadService.uploadVideo(file, lawyerId);

      if (!uploadResult.success) {
        return res.status(500).json({
          success: false,
          message: 'Failed to upload video',
          error: uploadResult.error
        });
      }

      // Update lawyer record with video URL - using otherDocumentUrl for video
      await prisma.lawyer.update({
        where: { id: lawyerId },
        data: {
          otherDocumentUrl: uploadResult.url ? [uploadResult.url] : undefined
        }
      });

      return res.status(200).json({
        success: true,
        message: 'Video uploaded successfully',
        data: {
          url: uploadResult.url,
          key: uploadResult.key
        }
      });

    } catch (error) {
      console.error('❌ Video upload error:', error);
      return res.status(500).json({
        success: false,
        message: 'Video upload failed',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  }

  /**
   * Upload profile photo
   */
  async uploadProfilePhoto(req: Request, res: Response) {
    try {
      const { lawyerId } = req.params;
      const file = req.file;

      if (!file) {
        return res.status(400).json({
          success: false,
          message: 'No image file provided'
        });
      }

      if (!lawyerId) {
        return res.status(400).json({
          success: false,
          message: 'Lawyer ID is required'
        });
      }

      // Check if lawyer exists
      const lawyer = await prisma.lawyer.findUnique({
        where: { id: lawyerId }
      });

      if (!lawyer) {
        return res.status(404).json({
          success: false,
          message: 'Lawyer not found'
        });
      }

      // Upload photo to S3
      const uploadResult = await this.uploadService.uploadSingleDocument(
        file,
        'profile-photo',
        lawyerId
      );

      if (!uploadResult.success) {
        return res.status(500).json({
          success: false,
          message: 'Failed to upload photo',
          error: uploadResult.error
        });
      }

      // Update user avatar field
      await prisma.user.update({
        where: { id: lawyer.userId },
        data: {
          avatar: uploadResult.url
        }
      });

      return res.status(200).json({
        success: true,
        message: 'Profile photo uploaded successfully',
        data: {
          url: uploadResult.url,
          key: uploadResult.key
        }
      });

    } catch (error) {
      console.error('❌ Profile photo upload error:', error);
      return res.status(500).json({
        success: false,
        message: 'Profile photo upload failed',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  }

  /**
   * Get all uploaded documents for a lawyer
   */
  async getLawyerDocuments(req: Request, res: Response) {
    try {
      const { lawyerId } = req.params;

      if (!lawyerId) {
        return res.status(400).json({
          success: false,
          message: 'Lawyer ID is required'
        });
      }

      const lawyer = await prisma.lawyer.findUnique({
        where: { id: lawyerId },
        select: {
          id: true,
          practicingCertificateUrl: true,
          barCertificateUrl: true,
          idDocumentUrl: true,
          cvResumeUrl: true,
          lawDegreeUrl: true,
          otherDocumentUrl: true,
          verifiedAt: true,
          user: {
            select: {
              avatar: true
            }
          }
        }
      });

      if (!lawyer) {
        return res.status(404).json({
          success: false,
          message: 'Lawyer not found'
        });
      }

      return res.status(200).json({
        success: true,
        data: {
          lawyerId: lawyer.id,
          documents: {
            practicingCertificate: lawyer.practicingCertificateUrl,
            barCertificate: lawyer.barCertificateUrl,
            idDocument: lawyer.idDocumentUrl,
            cvResume: lawyer.cvResumeUrl,
            lawDegree: lawyer.lawDegreeUrl,
            videoIntro: lawyer.otherDocumentUrl,
            profilePhoto: lawyer.user.avatar
          },
          lastUpdated: lawyer.verifiedAt
        }
      });

    } catch (error) {
      console.error('❌ Get documents error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve documents',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  }

  /**
   * Delete a document
   */
  async deleteDocument(req: Request, res: Response) {
    try {
      const { lawyerId, documentType } = req.params;

      if (!lawyerId || !documentType) {
        return res.status(400).json({
          success: false,
          message: 'Lawyer ID and document type are required'
        });
      }

      // Get current document URL to delete from S3
      const lawyer = await prisma.lawyer.findUnique({
        where: { id: lawyerId }
      });

      if (!lawyer) {
        return res.status(404).json({
          success: false,
          message: 'Lawyer not found'
        });
      }

      // Determine which field to clear and get the URL for S3 deletion
      let documentUrl: string | null = null;
      const updateData: any = {};

      switch (documentType) {
        case 'bar-certificate':
          documentUrl = Array.isArray(lawyer.barCertificateUrl) ? lawyer.barCertificateUrl[0] : lawyer.barCertificateUrl;
          updateData.barCertificateUrl = null;
          break;
        case 'practicing-certificate':
          documentUrl = Array.isArray(lawyer.practicingCertificateUrl) ? lawyer.practicingCertificateUrl[0] : lawyer.practicingCertificateUrl;
          updateData.practicingCertificateUrl = null;
          break;
        case 'id-document':
          documentUrl = Array.isArray(lawyer.idDocumentUrl) ? lawyer.idDocumentUrl[0] : lawyer.idDocumentUrl;
          updateData.idDocumentUrl = null;
          break;
        case 'cv-resume':
          documentUrl = Array.isArray(lawyer.cvResumeUrl) ? lawyer.cvResumeUrl[0] : lawyer.cvResumeUrl;
          updateData.cvResumeUrl = null;
          break;
        case 'law-degree':
          documentUrl = Array.isArray(lawyer.lawDegreeUrl) ? lawyer.lawDegreeUrl[0] : lawyer.lawDegreeUrl;
          updateData.lawDegreeUrl = null;
          break;
        case 'video-intro':
          documentUrl = Array.isArray(lawyer.otherDocumentUrl) ? lawyer.otherDocumentUrl[0] : lawyer.otherDocumentUrl;
          updateData.otherDocumentUrl = null;
          break;
        default:
          return res.status(400).json({
            success: false,
            message: 'Invalid document type'
          });
      }

      if (!documentUrl) {
        return res.status(404).json({
          success: false,
          message: 'Document not found'
        });
      }

      // Delete from S3
      const deleteResult = await this.uploadService.deleteDocument(lawyerId, documentType, documentUrl);

      if (!deleteResult.success) {
        return res.status(500).json({
          success: false,
          message: 'Failed to delete document from storage',
          error: deleteResult.error
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Document deleted successfully',
        data: {
          documentType,
          deletedUrl: documentUrl
        }
      });

    } catch (error) {
      console.error('❌ Delete document error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to delete document',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  }
}
