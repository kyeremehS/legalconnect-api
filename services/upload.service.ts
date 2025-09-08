import { 
  uploadLegalDocument, 
  uploadVideoToS3, 
  deleteFileFromS3, 
  getPresignedUrl,
  UploadResult 
} from '../utils/aws';
import prisma from '../prisma/prismaClient';

export interface DocumentUploadResult {
  uploadedFiles: string[];
  urls: { [key: string]: string };
  failed: string[];
}

export class UploadService {

  /**
   * Upload multiple lawyer documents and store URLs in database
   */
  async uploadLawyerDocuments(
    files: { [fieldname: string]: Express.Multer.File[] },
    lawyerId: string
  ): Promise<DocumentUploadResult> {
    const result: DocumentUploadResult = {
      uploadedFiles: [],
      urls: {},
      failed: []
    };

    // Document type mapping to database fields
    const documentTypes = {
      'practisingCertificate': { key: 'practicingCertificateUrl', folder: 'practising-certificate' },
      'barCertificate': { key: 'barCertificateUrl', folder: 'bar-certificate' },
      'idDocument': { key: 'idDocumentUrl', folder: 'id-document' },
      'cvResume': { key: 'cvResumeUrl', folder: 'cv-resume' },
      'lawDegree': { key: 'lawDegreeUrl', folder: 'law-degree' },
      'profilePhoto': { key: 'otherDocumentUrl', folder: 'profile-photo' },
      'videoIntro': { key: 'videoUrl', folder: 'video-intro' }
    };

    // Verify lawyer exists
    const lawyer = await prisma.lawyer.findUnique({
      where: { id: lawyerId }
    });

    if (!lawyer) {
      throw new Error('Lawyer not found');
    }

    // Store successful uploads for database update
    const dbUpdates: { [key: string]: string[] } = {};

    // Get current lawyer data to append to existing arrays
    const currentLawyer = await prisma.lawyer.findUnique({
      where: { id: lawyerId },
      select: {
        practicingCertificateUrl: true,
        barCertificateUrl: true,
        idDocumentUrl: true,
        cvResumeUrl: true,
        lawDegreeUrl: true,
        otherDocumentUrl: true,
        videoUrl: true
      }
    });

    if (!currentLawyer) {
      throw new Error('Lawyer not found');
    }

    // Process each file type
    for (const [fieldName, fileArray] of Object.entries(files)) {
      if (fileArray && fileArray.length > 0) {
        const file = fileArray[0]; // Take first file if multiple
        const documentConfig = documentTypes[fieldName as keyof typeof documentTypes];

        if (documentConfig) {
          try {
            console.log(`📁 Uploading ${fieldName} for lawyer ${lawyerId}`);
            
            const uploadResult: UploadResult = await uploadLegalDocument(
              file.buffer,
              file.originalname,
              documentConfig.folder,
              lawyerId,
              file.mimetype
            );

            if (uploadResult.success && uploadResult.url) {
              result.uploadedFiles.push(fieldName);
              result.urls[documentConfig.key] = uploadResult.url;
              
              // Append to existing array or create new array
              const currentUrls = currentLawyer[documentConfig.key as keyof typeof currentLawyer] as string[] || [];
              dbUpdates[documentConfig.key] = [...currentUrls, uploadResult.url];
              
              console.log(`✅ ${fieldName} uploaded successfully: ${uploadResult.url}`);
            } else {
              result.failed.push(fieldName);
              console.error(`❌ Failed to upload ${fieldName}:`, uploadResult.error);
            }
          } catch (error) {
            result.failed.push(fieldName);
            console.error(`❌ Error uploading ${fieldName}:`, error);
          }
        } else {
          result.failed.push(fieldName);
          console.warn(`⚠️ Unknown document type: ${fieldName}`);
        }
      }
    }

    // Update database with all successful uploads
    if (Object.keys(dbUpdates).length > 0) {
      try {
        await prisma.lawyer.update({
          where: { id: lawyerId },
          data: dbUpdates
        });
        console.log(`💾 Database updated with ${Object.keys(dbUpdates).length} document URLs`);
      } catch (error) {
        console.error('❌ Failed to update database:', error);
        // Note: Files are uploaded to S3 but database update failed
      }
    }

    return result;
  }

  /**
   * Upload a single document and store URL in database
   */
  async uploadSingleDocument(
    file: Express.Multer.File,
    documentType: string,
    lawyerId: string
  ): Promise<UploadResult> {
    try {
      console.log(`📄 Uploading single document: ${documentType} for lawyer ${lawyerId}`);

      // Verify lawyer exists
      const lawyer = await prisma.lawyer.findUnique({
        where: { id: lawyerId }
      });

      if (!lawyer) {
        return {
          success: false,
          error: 'Lawyer not found'
        };
      }

      // Upload to S3
      const uploadResult = await uploadLegalDocument(
        file.buffer,
        file.originalname,
        documentType,
        lawyerId,
        file.mimetype
      );

      if (uploadResult.success && uploadResult.url) {
        // Map document type to database field
        const fieldMapping: { [key: string]: string } = {
          'practising-certificate': 'practicingCertificateUrl',
          'bar-certificate': 'barCertificateUrl',
          'id-document': 'idDocumentUrl',
          'cv-resume': 'cvResumeUrl',
          'law-degree': 'lawDegreeUrl',
          'profile-photo': 'otherDocumentUrl',
          'video-intro': 'videoUrl'
        };

        const dbField = fieldMapping[documentType];
        
        if (dbField) {
          try {
            // Get current URLs to append to existing array
            const currentLawyer = await prisma.lawyer.findUnique({
              where: { id: lawyerId },
              select: {
                practicingCertificateUrl: true,
                barCertificateUrl: true,
                idDocumentUrl: true,
                cvResumeUrl: true,
                lawDegreeUrl: true,
                otherDocumentUrl: true,
                videoUrl: true
              }
            });

            if (currentLawyer) {
              const currentUrls = currentLawyer[dbField as keyof typeof currentLawyer] as string[] || [];
              const updatedUrls = [...currentUrls, uploadResult.url];

              // Update database with S3 URL appended to array
              await prisma.lawyer.update({
                where: { id: lawyerId },
                data: {
                  [dbField]: updatedUrls
                }
              });
              console.log(`💾 Database updated: ${dbField} array with new URL: ${uploadResult.url}`);
            }
          } catch (dbError) {
            console.error('❌ Failed to update database:', dbError);
            // Note: File uploaded to S3 but database update failed
          }
        }

        console.log(`✅ Document uploaded successfully: ${uploadResult.url}`);
      } else {
        console.error(`❌ Upload failed: ${uploadResult.error}`);
      }

      return uploadResult;
    } catch (error) {
      console.error(`❌ Single document upload error:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed'
      };
    }
  }

  /**
   * Upload video file
   */
  async uploadVideo(
    file: Express.Multer.File,
    lawyerId: string
  ): Promise<UploadResult> {
    try {
      console.log(`🎥 Uploading video for lawyer ${lawyerId}`);

      // Validate file size (max 50MB for videos)
      const maxVideoSize = 50 * 1024 * 1024; // 50MB
      if (file.size > maxVideoSize) {
        return {
          success: false,
          error: 'Video file too large. Maximum size is 50MB.'
        };
      }

      // Validate video type
      const allowedVideoTypes = [
        'video/mp4',
        'video/avi',
        'video/quicktime',
        'video/webm',
        'video/x-msvideo'
      ];

      if (!allowedVideoTypes.includes(file.mimetype)) {
        return {
          success: false,
          error: 'Invalid video format. Allowed: MP4, AVI, QuickTime, WebM'
        };
      }

      const uploadResult = await uploadVideoToS3(
        file.buffer,
        file.originalname,
        `lawyer-videos/${lawyerId}`,
        file.mimetype
      );

      if (uploadResult.success && uploadResult.url) {
        try {
          // Get current video URLs to append to existing array
          const currentLawyer = await prisma.lawyer.findUnique({
            where: { id: lawyerId },
            select: {
              videoUrl: true
            }
          });

          if (currentLawyer) {
            const currentVideoUrls = currentLawyer.videoUrl || [];
            const updatedVideoUrls = [...currentVideoUrls, uploadResult.url];

            // Update database with new video URL appended to array
            await prisma.lawyer.update({
              where: { id: lawyerId },
              data: {
                videoUrl: updatedVideoUrls
              }
            });
            console.log(`💾 Database updated: videoUrl array with new URL: ${uploadResult.url}`);
          }
        } catch (dbError) {
          console.error('❌ Failed to update database:', dbError);
          // Note: Video uploaded to S3 but database update failed
        }

        console.log(`✅ Video uploaded successfully: ${uploadResult.url}`);
      } else {
        console.error(`❌ Video upload failed: ${uploadResult.error}`);
      }

      return uploadResult;
    } catch (error) {
      console.error(`❌ Video upload error:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Video upload failed'
      };
    }
  }

  /**
   * Delete a document from S3 and update database array
   */
  async deleteDocument(
    lawyerId: string,
    documentType: string,
    documentUrl: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const fieldMapping: { [key: string]: string } = {
        'practising-certificate': 'practicingCertificateUrl',
        'bar-certificate': 'barCertificateUrl',
        'id-document': 'idDocumentUrl',
        'cv-resume': 'cvResumeUrl',
        'law-degree': 'lawDegreeUrl',
        'profile-photo': 'otherDocumentUrl',
        'video-intro': 'videoUrl'
      };

      const fieldName = fieldMapping[documentType];
      if (!fieldName) {
        return {
          success: false,
          error: 'Invalid document type'
        };
      }

      // Get current lawyer data
      const lawyer = await prisma.lawyer.findUnique({
        where: { id: lawyerId },
        select: {
          practicingCertificateUrl: true,
          barCertificateUrl: true,
          idDocumentUrl: true,
          cvResumeUrl: true,
          lawDegreeUrl: true,
          otherDocumentUrl: true,
          videoUrl: true
        }
      });

      if (!lawyer) {
        return {
          success: false,
          error: 'Lawyer not found'
        };
      }

      const currentUrls = lawyer[fieldName as keyof typeof lawyer] as string[] || [];
      
      // Check if URL exists in the array
      if (!currentUrls.includes(documentUrl)) {
        return {
          success: false,
          error: 'Document not found in database'
        };
      }

      // Extract S3 key from URL
      const urlParts = documentUrl.split('/');
      const bucketIndex = urlParts.findIndex((part: string) => part.includes('s3.'));
      if (bucketIndex === -1) {
        return {
          success: false,
          error: 'Invalid S3 URL format'
        };
      }

      const key = urlParts.slice(bucketIndex + 2).join('/');

      // Delete from S3
      const deleteSuccess = await deleteFileFromS3(key);
      if (!deleteSuccess) {
        return {
          success: false,
          error: 'Failed to delete file from S3'
        };
      }

      // Remove URL from array
      const updatedUrls = currentUrls.filter(url => url !== documentUrl);

      // Update database
      await prisma.lawyer.update({
        where: { id: lawyerId },
        data: {
          [fieldName]: updatedUrls
        }
      });

      console.log(`🗑️ Deleted ${documentType} for lawyer ${lawyerId}: ${documentUrl}`);
      return { success: true };

    } catch (error) {
      console.error(`❌ Delete document error:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Delete failed'
      };
    }
  }

  /**
   * Get all documents for a lawyer
   */
  async getLawyerDocuments(lawyerId: string): Promise<{
    practicingCertificateUrl: string[];
    barCertificateUrl: string[];
    idDocumentUrl: string[];
    cvResumeUrl: string[];
    lawDegreeUrl: string[];
    otherDocumentUrl: string[];
    videoUrl: string[];
  } | null> {
    try {
      const lawyer = await prisma.lawyer.findUnique({
        where: { id: lawyerId },
        select: {
          practicingCertificateUrl: true,
          barCertificateUrl: true,
          idDocumentUrl: true,
          cvResumeUrl: true,
          lawDegreeUrl: true,
          otherDocumentUrl: true,
          videoUrl: true
        }
      });

      return lawyer;
    } catch (error) {
      console.error(`❌ Get documents error:`, error);
      return null;
    }
  }

  /**
   * Get presigned URL for secure file access
   */
  async getPresignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    try {
      return await getPresignedUrl(key, expiresIn);
    } catch (error) {
      console.error(`❌ Presigned URL error:`, error);
      throw error;
    }
  }

  /**
   * Validate file type and size
   */
  validateFile(file: Express.Multer.File, maxSize: number = 10485760): { valid: boolean; error?: string } {
    // Check file size (default 10MB)
    if (file.size > maxSize) {
      return {
        valid: false,
        error: `File too large. Maximum size is ${Math.round(maxSize / 1024 / 1024)}MB`
      };
    }

    // Check file type
    const allowedTypes = [
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'video/mp4',
      'video/avi',
      'video/quicktime',
      'video/webm',
      'video/x-msvideo'
    ];

    if (!allowedTypes.includes(file.mimetype)) {
      return {
        valid: false,
        error: 'Invalid file type. Allowed: PDF, DOC, DOCX, JPG, PNG, MP4, AVI, QuickTime, WebM'
      };
    }

    return { valid: true };
  }

  /**
   * Get document statistics for a lawyer
   */
  async getDocumentStats(lawyerId: string) {
    try {
      const lawyer = await prisma.lawyer.findUnique({
        where: { id: lawyerId },
        select: {
          practicingCertificateUrl: true,
          barCertificateUrl: true,
          idDocumentUrl: true,
          cvResumeUrl: true,
          lawDegreeUrl: true,
          otherDocumentUrl: true,
          videoUrl: true
        }
      });

      if (!lawyer) {
        throw new Error('Lawyer not found');
      }

      const documents = [
        { name: 'Practicing Certificate', urls: lawyer.practicingCertificateUrl },
        { name: 'Bar Certificate', urls: lawyer.barCertificateUrl },
        { name: 'ID Document', urls: lawyer.idDocumentUrl },
        { name: 'CV/Resume', urls: lawyer.cvResumeUrl },
        { name: 'Law Degree', urls: lawyer.lawDegreeUrl },
        { name: 'Other Documents', urls: lawyer.otherDocumentUrl },
        { name: 'Video Introductions', urls: lawyer.videoUrl }
      ];

      const uploaded = documents.filter(doc => doc.urls && doc.urls.length > 0).length;
      const total = documents.length;
      const completionPercentage = Math.round((uploaded / total) * 100);

      const totalFiles = documents.reduce((sum, doc) => sum + (doc.urls?.length || 0), 0);

      return {
        total,
        uploaded,
        missing: total - uploaded,
        completionPercentage,
        totalFiles,
        documents: documents.map(doc => ({
          name: doc.name,
          uploaded: !!(doc.urls && doc.urls.length > 0),
          count: doc.urls?.length || 0,
          urls: doc.urls || []
        }))
      };

    } catch (error) {
      console.error('❌ Document stats error:', error);
      throw error;
    }
  }
}
