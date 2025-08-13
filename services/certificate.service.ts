import { PrismaClient } from '../generated/prisma';

const prisma = new PrismaClient();

// Enhanced date parsing function (same as in seed.ts)
function parseFlexibleDate(dateValue: string | number | Date): Date | null {
  if (dateValue instanceof Date) {
    return dateValue;
  }
  
  if (typeof dateValue === 'number') {
    return new Date(dateValue);
  }
  
  const dateStr = String(dateValue).trim();
  
  // Try standard JavaScript Date parsing first
  let parsedDate = new Date(dateStr);
  if (!isNaN(parsedDate.getTime())) {
    return parsedDate;
  }
  
  // Handle DD/MM/YYYY and MM/DD/YYYY formats
  if (dateStr.includes('/')) {
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      const [first, second, year] = parts.map(p => parseInt(p, 10));
      
      // Try DD/MM/YYYY format first (common in UK/EU)
      if (first > 12 && second <= 12) {
        // Must be DD/MM/YYYY (day > 12, month <= 12)
        parsedDate = new Date(year, second - 1, first);
        if (!isNaN(parsedDate.getTime())) {
          return parsedDate;
        }
      }
      
      // Try MM/DD/YYYY format
      if (first <= 12 && second <= 31) {
        parsedDate = new Date(year, first - 1, second);
        if (!isNaN(parsedDate.getTime())) {
          return parsedDate;
        }
      }
      
      // If both are <= 12, prefer DD/MM/YYYY (European standard)
      if (first <= 12 && second <= 12) {
        parsedDate = new Date(year, second - 1, first);
        if (!isNaN(parsedDate.getTime())) {
          return parsedDate;
        }
      }
    }
  }
  
  // Handle DD-MM-YYYY format
  if (dateStr.includes('-')) {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const [first, second, year] = parts.map(p => parseInt(p, 10));
      
      // Try DD-MM-YYYY format
      if (first > 12 && second <= 12) {
        parsedDate = new Date(year, second - 1, first);
        if (!isNaN(parsedDate.getTime())) {
          return parsedDate;
        }
      }
      
      // Try MM-DD-YYYY format
      if (first <= 12 && second <= 31) {
        parsedDate = new Date(year, first - 1, second);
        if (!isNaN(parsedDate.getTime())) {
          return parsedDate;
        }
      }
    }
  }
  
  // Handle DD.MM.YYYY format
  if (dateStr.includes('.')) {
    const parts = dateStr.split('.');
    if (parts.length === 3) {
      const [first, second, year] = parts.map(p => parseInt(p, 10));
      
      // Try DD.MM.YYYY format
      parsedDate = new Date(year, second - 1, first);
      if (!isNaN(parsedDate.getTime())) {
        return parsedDate;
      }
    }
  }
  
  return null;
}

/**
 * Verifies if a certificate exists in the database with the given parameters
 * @param nameOfLawyer - Name of the lawyer (case-insensitive)
 * @param dateOfIssue - Date of issue in string format (supports multiple formats)
 * @param certificateNumber - Certificate number (case-insensitive)
 * @returns Promise<boolean> - True if certificate exists and matches, false otherwise
 */
export async function verifyCertificate(
  nameOfLawyer: string,
  dateOfIssue: string,
  certificateNumber: string
): Promise<boolean> {
  try {
    // Trim and clean input
    const cleanName = nameOfLawyer.trim();
    const cleanCertNumber = certificateNumber.trim();
    
    // Parse the date using flexible parsing
    const parsedDate = parseFlexibleDate(dateOfIssue);
    if (!parsedDate || isNaN(parsedDate.getTime())) {
      console.error('Invalid date format provided:', dateOfIssue);
      return false;
    }

    // Query database for exact match
    const certificate = await prisma.certificate.findFirst({
      where: {
        nameOfLawyer: {
          equals: cleanName,
          mode: 'insensitive'
        },
        certificateNumber: {
          equals: cleanCertNumber,
          mode: 'insensitive'
        },
        dateOfIssue: {
          equals: parsedDate
        }
      }
    });

    return certificate !== null;
    
  } catch (error) {
    console.error('Error verifying certificate:', error);
    return false;
  }
}

/**
 * Search for certificates by lawyer name (partial match)
 * @param nameOfLawyer - Partial or full name of lawyer
 * @returns Promise<Certificate[]> - Array of matching certificates
 */
export async function searchCertificatesByName(nameOfLawyer: string) {
  try {
    const cleanName = nameOfLawyer.trim();
    
    const certificates = await prisma.certificate.findMany({
      where: {
        nameOfLawyer: {
          contains: cleanName,
          mode: 'insensitive'
        }
      },
      orderBy: {
        nameOfLawyer: 'asc'
      }
    });

    return certificates;
    
  } catch (error) {
    console.error('Error searching certificates:', error);
    return [];
  }
}

/**
 * Get certificate by certificate number with flexible matching
 * @param certificateNumber - Certificate number to search for
 * @returns Promise<Certificate | null> - Certificate if found, null otherwise
 */
export async function getCertificateByNumber(certificateNumber: string) {
  try {
    const cleanCertNumber = certificateNumber.trim();
    console.log('🔍 Service searching for certificate:', JSON.stringify(cleanCertNumber));
    
    // Try exact match first
    let certificate = await prisma.certificate.findFirst({
      where: {
        certificateNumber: {
          equals: cleanCertNumber,
          mode: 'insensitive'
        }
      }
    });

    if (certificate) {
      console.log('✅ Found certificate with exact match');
      return certificate;
    }

    // If not found, try with normalized spaces (single spaces)
    const normalizedNumber = cleanCertNumber.replace(/\s+/g, ' ');
    if (normalizedNumber !== cleanCertNumber) {
      console.log('🔍 Trying with normalized spaces:', JSON.stringify(normalizedNumber));
      certificate = await prisma.certificate.findFirst({
        where: {
          certificateNumber: {
            equals: normalizedNumber,
            mode: 'insensitive'
          }
        }
      });

      if (certificate) {
        console.log('✅ Found certificate with normalized spaces');
        return certificate;
      }
    }

    // If still not found, try contains search (partial match)
    console.log('🔍 Trying partial match search...');
    certificate = await prisma.certificate.findFirst({
      where: {
        certificateNumber: {
          contains: cleanCertNumber,
          mode: 'insensitive'
        }
      }
    });

    if (certificate) {
      console.log('✅ Found certificate with partial match');
      return certificate;
    }

    // Last resort: try removing all spaces and special characters
    const alphanumericOnly = cleanCertNumber.replace(/[^a-zA-Z0-9]/g, '');
    if (alphanumericOnly.length > 3) { // Only try if we have meaningful content
      console.log('🔍 Trying alphanumeric only search:', JSON.stringify(alphanumericOnly));
      
      const certificates = await prisma.certificate.findMany({
        where: {
          certificateNumber: {
            mode: 'insensitive'
          }
        }
      });

      // Check if any certificate number matches when stripped of special characters
      const match = certificates.find(cert => {
        const certAlphanumeric = cert.certificateNumber.replace(/[^a-zA-Z0-9]/g, '');
        return certAlphanumeric.toLowerCase() === alphanumericOnly.toLowerCase();
      });

      if (match) {
        console.log('✅ Found certificate with alphanumeric match');
        return match;
      }
    }

    console.log('❌ Certificate not found with any matching strategy');
    return null;
    
  } catch (error) {
    console.error('Error getting certificate by number:', error);
    return null;
  }
}

// Close Prisma connection when the process exits
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});
