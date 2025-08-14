# Lawyer Document Upload API

## Overview
The upload system provides comprehensive file management for lawyer documents with AWS S3 integration.

## API Endpoints

### 1. Upload Multiple Documents
```
POST /api/uploads/lawyer/{lawyerId}/documents
Content-Type: multipart/form-data

Form fields:
- practisingCertificate: file
- barCertificate: file
- idDocument: file
- cvResume: file
- profilePhoto: file
```

### 2. Upload Single Document
```
POST /api/uploads/lawyer/{lawyerId}/document/{documentType}
Content-Type: multipart/form-data

Form field:
- file: file

Document types:
- practising-certificate
- bar-certificate
- id-document
- cv-resume
- profile-photo
```

### 3. Upload Video
```
POST /api/uploads/lawyer/{lawyerId}/video
Content-Type: multipart/form-data

Form field:
- video: file (MP4, AVI, QuickTime, WebM, WMV)
Max size: 100MB
```

### 4. Delete Document
```
DELETE /api/uploads/lawyer/{lawyerId}/document/{documentType}
```

### 5. Get Lawyer Documents
```
GET /api/uploads/lawyer/{lawyerId}/documents
```

### 6. Get Presigned URL
```
GET /api/uploads/presigned/{s3Key}?expiresIn=3600
```

## File Types Supported

### Documents (10MB limit)
- PDF: `application/pdf`
- Word: `application/msword`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
- Images: `image/jpeg`, `image/jpg`, `image/png`

### Videos (100MB limit)
- MP4: `video/mp4`
- AVI: `video/avi`, `video/x-msvideo`
- QuickTime: `video/quicktime`
- WebM: `video/webm`
- WMV: `video/x-ms-wmv`

## S3 Folder Structure
```
legalconnect-bucket/
├── legal-documents/
│   └── {lawyerId}/
│       ├── practising-certificate/
│       ├── bar-certificate/
│       ├── id-document/
│       ├── cv-resume/
│       └── profile-photo/
└── lawyer-videos/
    └── {lawyerId}/
```

## Example Usage (Frontend)

### Upload Multiple Documents
```javascript
const uploadDocuments = async (lawyerId, files) => {
  const formData = new FormData();
  
  if (files.practisingCertificate) {
    formData.append('practisingCertificate', files.practisingCertificate);
  }
  if (files.barCertificate) {
    formData.append('barCertificate', files.barCertificate);
  }
  if (files.idDocument) {
    formData.append('idDocument', files.idDocument);
  }
  if (files.cvResume) {
    formData.append('cvResume', files.cvResume);
  }
  if (files.profilePhoto) {
    formData.append('profilePhoto', files.profilePhoto);
  }

  const response = await fetch(`/api/uploads/lawyer/${lawyerId}/documents`, {
    method: 'POST',
    body: formData
  });

  return response.json();
};
```

### Upload Single Document
```javascript
const uploadSingleDocument = async (lawyerId, documentType, file) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`/api/uploads/lawyer/${lawyerId}/document/${documentType}`, {
    method: 'POST',
    body: formData
  });

  return response.json();
};
```

### Upload Video
```javascript
const uploadVideo = async (lawyerId, videoFile) => {
  const formData = new FormData();
  formData.append('video', videoFile);

  const response = await fetch(`/api/uploads/lawyer/${lawyerId}/video`, {
    method: 'POST',
    body: formData
  });

  return response.json();
};
```

## Response Examples

### Success Response
```json
{
  "success": true,
  "message": "Documents uploaded successfully",
  "data": {
    "uploadedFiles": ["practisingCertificate", "barCertificate"],
    "urls": {
      "practisingCertificateUrl": "https://legalconnect-bucket.s3.us-east-1.amazonaws.com/legal-documents/123/practising-certificate/uuid-cert.pdf",
      "barCertificateUrl": "https://legalconnect-bucket.s3.us-east-1.amazonaws.com/legal-documents/123/bar-certificate/uuid-bar.pdf"
    },
    "failed": []
  }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Failed to upload documents",
  "error": "File too large. Maximum size is 10MB"
}
```

## Security Features
- File type validation
- File size limits
- Unique file naming (UUID)
- Public read access for easy display
- Presigned URLs for secure access
- Organized folder structure by lawyer ID

## Database Integration
All uploaded file URLs are automatically stored in the lawyer record:
- `practisingCertificateUrl`
- `barCertificateUrl`
- `idDocumentUrl`
- `cvResumeUrl`
- `profilePhotoUrl`
- `videoIntroUrl`

## Error Handling
- Invalid file types rejected
- File size limits enforced
- S3 upload failures handled gracefully
- Database update failures logged
- Comprehensive error messages returned
