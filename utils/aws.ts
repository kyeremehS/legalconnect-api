import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

// AWS S3 Configuration
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || 'legalconnect-bucket';

export interface UploadResult {
  success: boolean;
  url?: string;
  key?: string;
  error?: string;
}

/**
 * Upload a file to S3
 * @param file - The file buffer to upload
 * @param fileName - Original filename
 * @param folder - S3 folder/prefix (e.g., 'documents', 'videos', 'images')
 * @param contentType - MIME type of the file
 * @returns Promise<UploadResult>
 */
export const uploadFileToS3 = async (
  file: Buffer,
  fileName: string,
  folder: string = 'uploads',
  contentType?: string
): Promise<UploadResult> => {
  try {
    // Generate unique filename
    const fileExtension = path.extname(fileName);
    const uniqueFileName = `${uuidv4()}${fileExtension}`;
    const key = `${folder}/${uniqueFileName}`;

    // Upload parameters
    const uploadParams = {
      Bucket: BUCKET_NAME,
      Key: key,
      Body: file,
      ContentType: contentType,
    };

    // Execute upload
    const command = new PutObjectCommand(uploadParams);
    await s3Client.send(command);

    // Construct public URL
    const url = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

    return {
      success: true,
      url,
      key,
    };
  } catch (error) {
    console.error('S3 Upload Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed',
    };
  }
};

/**
 * Upload multiple files to S3
 * @param files - Array of file objects with buffer, filename, and contentType
 * @param folder - S3 folder/prefix
 * @returns Promise<UploadResult[]>
 */
export const uploadMultipleFilesToS3 = async (
  files: Array<{ buffer: Buffer; fileName: string; contentType?: string }>,
  folder: string = 'uploads'
): Promise<UploadResult[]> => {
  const uploadPromises = files.map(file =>
    uploadFileToS3(file.buffer, file.fileName, folder, file.contentType)
  );

  return Promise.all(uploadPromises);
};

/**
 * Delete a file from S3
 * @param key - The S3 key/path of the file to delete
 * @returns Promise<boolean>
 */
export const deleteFileFromS3 = async (key: string): Promise<boolean> => {
  try {
    const deleteParams = {
      Bucket: BUCKET_NAME,
      Key: key,
    };

    const command = new DeleteObjectCommand(deleteParams);
    await s3Client.send(command);

    return true;
  } catch (error) {
    console.error('S3 Delete Error:', error);
    return false;
  }
};

/**
 * Generate a presigned URL for secure file access
 * @param key - The S3 key/path of the file
 * @param expiresIn - URL expiration time in seconds (default: 1 hour)
 * @returns Promise<string>
 */
export const getPresignedUrl = async (
  key: string,
  expiresIn: number = 3600
): Promise<string> => {
  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn });
    return signedUrl;
  } catch (error) {
    console.error('Presigned URL Error:', error);
    throw error;
  }
};

/**
 * Upload file with organized folder structure for legal documents
 * @param file - File buffer
 * @param fileName - Original filename
 * @param documentType - Type of document (e.g., 'practising-certificate', 'bar-license', 'id-document', 'cv-resume')
 * @param lawyerId - Lawyer's ID for organization
 * @param contentType - MIME type
 * @returns Promise<UploadResult>
 */
export const uploadLegalDocument = async (
  file: Buffer,
  fileName: string,
  documentType: string,
  lawyerId: string,
  contentType?: string
): Promise<UploadResult> => {
  const folder = `legal-documents/${lawyerId}/${documentType}`;
  return uploadFileToS3(file, fileName, folder, contentType);
};

/**
 * Upload video file with optimized settings
 * @param file - Video file buffer
 * @param fileName - Original filename
 * @param folder - S3 folder (default: 'videos')
 * @param contentType - Video MIME type
 * @returns Promise<UploadResult>
 */
export const uploadVideoToS3 = async (
  file: Buffer,
  fileName: string,
  folder: string = 'videos',
  contentType?: string
): Promise<UploadResult> => {
  return uploadFileToS3(file, fileName, folder, contentType);
};

// Export S3 client for advanced usage
export { s3Client, BUCKET_NAME };