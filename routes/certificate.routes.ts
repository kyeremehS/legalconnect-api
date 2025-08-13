import { Router } from 'express';
import { certificateController } from '../controllers/certificate.controller';
import { authenticate, authorize } from '../middlewares/Auth.middleware';
import { validateSchema } from '../middlewares/validation.middleware';
import { z } from 'zod';

const router = Router();

// Validation schemas
const verifyCertificateSchema = z.object({
  nameOfLawyer: z.string().min(1, 'Name of lawyer is required').trim(),
  dateOfIssue: z.string().min(1, 'Date of issue is required'),
  certificateNumber: z.string().min(1, 'Certificate number is required').trim()
});

// Public endpoint to verify certificate
// POST /api/certificates/verify
router.post('/verify', 
  certificateController.verifyCertificate.bind(certificateController)
);

// Public endpoint to search certificates by name
// GET /api/certificates/search?name=<lawyer_name>
router.get('/search',
  certificateController.searchCertificates.bind(certificateController)
);

// Alternative endpoint using query parameter (more reliable for complex strings)
// GET /api/certificates/lookup?number=<certificate_number>
router.get('/lookup', async (req, res) => {
  try {
    const certificateNumber = req.query.number as string;
    
    if (!certificateNumber) {
      return res.status(400).json({
        success: false,
        message: 'Certificate number is required in query parameter: ?number=XXX'
      });
    }
    
    console.log('🔍 Query certificate number:', JSON.stringify(certificateNumber));
    
    // Create a new request object with the certificate number
    const modifiedReq = { ...req, params: { ...req.params, certificateNumber } };
    return certificateController.getCertificateByNumber.bind(certificateController)(modifiedReq as any, res);
  } catch (error) {
    console.error('Error fetching certificate:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get certificate by number - Updated to handle complex certificate numbers
// GET /api/certificates/number/<certificate_number>
router.get('/number/:certificateNumber(*)', async (req, res) => {
  try {
    console.log('🔍 Raw URL param:', req.params.certificateNumber);
    
    // Handle the full path including slashes
    let certificateNumber = req.params.certificateNumber;
    
    // Decode URL encoding
    certificateNumber = decodeURIComponent(certificateNumber);
    console.log('🔍 Decoded certificate number:', JSON.stringify(certificateNumber));
    
    // Create a new request object with the decoded certificate number
    const modifiedReq = { ...req, params: { ...req.params, certificateNumber } };
    return certificateController.getCertificateByNumber.bind(certificateController)(modifiedReq as any, res);
  } catch (error) {
    console.error('Error fetching certificate:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      debug: {
        rawParam: req.params.certificateNumber,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    });
  }
});

// Legacy endpoint - kept for backwards compatibility
// GET /api/certificates/:certificateNumber
router.get('/:certificateNumber',
  certificateController.getCertificateByNumber.bind(certificateController)
);

// Protected endpoints (require authentication)

// Admin only - Get all certificates (with pagination)
router.get('/', 
  authenticate,
  authorize('ADMIN'),
  async (req, res) => {
    try {
      // This would be implemented in the controller
      res.status(501).json({
        success: false,
        message: 'Endpoint not implemented yet'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
);

export default router;
