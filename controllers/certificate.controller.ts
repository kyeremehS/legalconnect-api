import { Request, Response } from 'express';
import { verifyCertificate, searchCertificatesByName, getCertificateByNumber } from '../services/certificate.service';

export class CertificateController {
  
  /**
   * Verify a certificate by name, date, and certificate number
   * POST /api/certificates/verify
   * Body: { nameOfLawyer, dateOfIssue, certificateNumber }
   */
  async verifyCertificate(req: Request, res: Response) {
    try {
      console.log('🔍 Verification request received:', req.body);
      
      const { nameOfLawyer, dateOfIssue, certificateNumber } = req.body;

      // Validate required fields with specific messages
      const missingFields = [];
      if (!nameOfLawyer) missingFields.push('nameOfLawyer');
      if (!dateOfIssue) missingFields.push('dateOfIssue');
      if (!certificateNumber) missingFields.push('certificateNumber');

      if (missingFields.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Missing required fields: ${missingFields.join(', ')}`,
          received: req.body,
          missingFields
        });
      }

      console.log('🔍 Calling verification service with:', {
        nameOfLawyer,
        dateOfIssue,
        certificateNumber
      });

      const isValid = await verifyCertificate(nameOfLawyer, dateOfIssue, certificateNumber);

      return res.status(200).json({
        success: true,
        message: isValid ? 'Certificate verified successfully' : 'Certificate not found or invalid',
        data: {
          isValid,
          nameOfLawyer,
          dateOfIssue,
          certificateNumber
        }
      });

    } catch (error) {
      console.error('Error in verifyCertificate controller:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error during certificate verification',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Search certificates by lawyer name
   * GET /api/certificates/search?name=<lawyer_name>
   */
  async searchCertificates(req: Request, res: Response) {
    try {
      const { name } = req.query;

      if (!name || typeof name !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'Missing or invalid query parameter: name'
        });
      }

      const certificates = await searchCertificatesByName(name);

      return res.status(200).json({
        success: true,
        message: `Found ${certificates.length} certificate(s)`,
        data: certificates
      });

    } catch (error) {
      console.error('Error in searchCertificates controller:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error during certificate search'
      });
    }
  }

  /**
   * Get certificate by certificate number
   * GET /api/certificates/:certificateNumber
   */
  async getCertificateByNumber(req: Request, res: Response) {
    try {
      const { certificateNumber } = req.params;

      if (!certificateNumber) {
        return res.status(400).json({
          success: false,
          message: 'Missing certificate number parameter'
        });
      }

      console.log('🔍 Controller received certificate number:', JSON.stringify(certificateNumber));

      // Try multiple decoding approaches for complex certificate numbers
      let decodedCertNumber = certificateNumber;
      
      // Handle URL encoding
      try {
        decodedCertNumber = decodeURIComponent(certificateNumber);
        console.log('🔍 After URL decode:', JSON.stringify(decodedCertNumber));
        
        // Try second decode if it looks like it's still encoded
        if (decodedCertNumber.includes('%')) {
          decodedCertNumber = decodeURIComponent(decodedCertNumber);
          console.log('🔍 After second decode:', JSON.stringify(decodedCertNumber));
        }
      } catch (decodeError) {
        console.warn('⚠️ URL decode failed, using original:', decodeError);
        decodedCertNumber = certificateNumber;
      }

      const certificate = await getCertificateByNumber(decodedCertNumber);

      if (!certificate) {
        return res.status(404).json({
          success: false,
          message: 'Certificate not found',
          debug: {
            originalParam: certificateNumber,
            decodedParam: decodedCertNumber,
            searchAttempted: true
          }
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Certificate found',
        data: certificate
      });

    } catch (error) {
      console.error('Error in getCertificateByNumber controller:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error while fetching certificate',
        debug: {
          originalParam: req.params.certificateNumber,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      });
    }
  }
}

export const certificateController = new CertificateController();
