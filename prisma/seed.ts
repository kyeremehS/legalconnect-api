import { PrismaClient } from '../generated/prisma';
import * as XLSX from 'xlsx';
import * as path from 'path';
import * as fs from 'fs';

const prisma = new PrismaClient();

interface LawyerCertificateData {
  'Name of Lawyer': string;
  'Certificate No': string; // Changed from 'Certificate Number'
  'Date of Issue': string | number | Date;
}

interface ProcessedCertificateData {
  nameOfLawyer: string;
  dateOfIssue: Date;
  certificateNumber: string;
}

// Enhanced date parsing function
function parseFlexibleDate(dateValue: string | number | Date): Date | null {
  if (dateValue instanceof Date) {
    return dateValue;
  }
  
  if (typeof dateValue === 'number') {
    // Excel date serial number
    return XLSX.SSF.parse_date_code(dateValue);
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

async function seedCertificates() {
  try {
    console.log('🌱 Starting certificate seeding process...');

    // Path to the Excel file
    const excelFilePath = path.join(__dirname, 'Lawyers in Good Standing.xlsx');
    
    // Check if file exists
    if (!fs.existsSync(excelFilePath)) {
      console.error(`❌ Excel file not found at: ${excelFilePath}`);
      console.log('📝 Please place the "lawyers in good standing.xlsx" file in the prisma directory');
      return;
    }

    // Read the Excel file
    console.log('📖 Reading Excel file...');
    const workbook = XLSX.readFile(excelFilePath);
    const sheetName = workbook.SheetNames[0]; // Get the first sheet
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert to JSON
    const rawData: LawyerCertificateData[] = XLSX.utils.sheet_to_json(worksheet);
    console.log(`📊 Found ${rawData.length} rows in Excel file`);
    
    // Debug: Show actual column headers found
    if (rawData.length > 0) {
      console.log('🔍 Actual column headers found:', Object.keys(rawData[0]));
      console.log('📋 Expected headers: ["Name of Lawyer", "Certificate No", "Date of Issue"]');
    }

    // Process and validate data
    const validCertificates: ProcessedCertificateData[] = [];
    const skippedRows: number[] = [];

    rawData.forEach((row, index) => {
      try {
        // Check for missing fields
        if (!row['Name of Lawyer'] || !row['Date of Issue'] || !row['Certificate No']) {
          console.warn(`⚠️  Row ${index + 2} skipped: Missing required fields`);
          skippedRows.push(index + 2);
          return;
        }

        // Process the data
        const nameOfLawyer = String(row['Name of Lawyer']).trim();
        const certificateNumber = String(row['Certificate No']).trim();
        
        // Parse date using enhanced parsing function
        const dateOfIssue = parseFlexibleDate(row['Date of Issue']);

        // Validate date
        if (!dateOfIssue || isNaN(dateOfIssue.getTime())) {
          console.warn(`⚠️  Row ${index + 2} skipped: Invalid date format "${row['Date of Issue']}"`);
          skippedRows.push(index + 2);
          return;
        }

        validCertificates.push({
          nameOfLawyer,
          dateOfIssue,
          certificateNumber
        });

      } catch (error) {
        console.warn(`⚠️  Row ${index + 2} skipped: Processing error - ${error}`);
        skippedRows.push(index + 2);
      }
    });

    console.log(`✅ Processed ${validCertificates.length} valid certificates`);
    console.log(`⚠️  Skipped ${skippedRows.length} rows due to missing/invalid data`);

    // Insert data into database
    let insertedCount = 0;
    let duplicateCount = 0;
    let errorCount = 0;

    console.log('💾 Inserting certificates into database...');

    for (const certificate of validCertificates) {
      try {
        await prisma.certificate.create({
          data: certificate
        });
        insertedCount++;
        
        // Progress indicator
        if (insertedCount % 50 === 0) {
          console.log(`📝 Inserted ${insertedCount} certificates...`);
        }
        
      } catch (error: any) {
        if (error.code === 'P2002') {
          // Unique constraint violation (duplicate certificate number)
          console.log(`🔄 Duplicate certificate number: ${certificate.certificateNumber} for ${certificate.nameOfLawyer}`);
          duplicateCount++;
        } else {
          console.error(`❌ Error inserting certificate for ${certificate.nameOfLawyer}:`, error.message);
          errorCount++;
        }
      }
    }

    // Summary
    console.log('\n📊 Seeding Summary:');
    console.log(`✅ Successfully inserted: ${insertedCount} certificates`);
    console.log(`🔄 Duplicates skipped: ${duplicateCount} certificates`);
    console.log(`❌ Errors encountered: ${errorCount} certificates`);
    console.log(`⚠️  Invalid rows skipped: ${skippedRows.length} rows`);
    
    if (skippedRows.length > 0) {
      console.log(`📝 Skipped row numbers: ${skippedRows.slice(0, 10).join(', ')}${skippedRows.length > 10 ? '...' : ''}`);
    }

  } catch (error) {
    console.error('💥 Fatal error during seeding:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Helper function to verify certificate
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
        dateOfIssue: parsedDate
      }
    });

    return certificate !== null;
    
  } catch (error) {
    console.error('Error verifying certificate:', error);
    return false;
  }
}

// Run seeding if this file is executed directly
if (require.main === module) {
  seedCertificates()
    .then(() => {
      console.log('🎉 Certificate seeding completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Seeding failed:', error);
      process.exit(1);
    });
}
