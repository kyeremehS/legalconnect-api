# Certificate Verification System

This system allows verification of lawyer certificates from Ghana using an Excel database.

## Setup

### 1. Database Migration

The Certificate model has been added to the Prisma schema. Run the migration:

```bash
npx prisma migrate dev
```

### 2. Excel File Setup

Place your Excel file named `lawyers in good standing.xlsx` in the `prisma/` directory.

**Required Excel columns:**
- `Name of Lawyer` - Full name of the lawyer
- `Date of Issue` - Date when certificate was issued
- `Certificate Number` - Unique certificate identifier

### 3. Seed Database

Run the seed script to import data from Excel:

```bash
npm run seed
```

The script will:
- Read the Excel file
- Convert data to JSON
- Insert records into the database
- Skip rows with missing fields
- Handle duplicates gracefully
- Provide detailed logging

## API Endpoints

### Public Endpoints

#### Verify Certificate
```http
POST /api/certificates/verify
Content-Type: application/json

{
  "nameOfLawyer": "John Doe",
  "dateOfIssue": "2023-01-15",
  "certificateNumber": "CERT-12345"
}
```

Response:
```json
{
  "success": true,
  "message": "Certificate verified successfully",
  "data": {
    "isValid": true,
    "nameOfLawyer": "John Doe",
    "dateOfIssue": "2023-01-15",
    "certificateNumber": "CERT-12345"
  }
}
```

#### Search by Name
```http
GET /api/certificates/search?name=John
```

#### Get by Certificate Number
```http
GET /api/certificates/CERT-12345
```

## Usage in Code

### Verify Certificate Function

```typescript
import { verifyCertificate } from './services/certificate.service';

// Example usage
const isValid = await verifyCertificate(
  "John Doe",
  "2023-01-15",
  "CERT-12345"
);

if (isValid) {
  console.log("Certificate is valid!");
} else {
  console.log("Certificate not found or invalid");
}
```

### Search Functions

```typescript
import { 
  searchCertificatesByName, 
  getCertificateByNumber 
} from './services/certificate.service';

// Search by partial name
const certificates = await searchCertificatesByName("John");

// Get specific certificate
const certificate = await getCertificateByNumber("CERT-12345");
```

## Database Schema

```prisma
model Certificate {
  id                Int      @id @default(autoincrement())
  nameOfLawyer      String
  dateOfIssue       DateTime
  certificateNumber String   @unique
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  @@map("certificates")
}
```

## Features

- **Case-insensitive matching** for names and certificate numbers
- **Exact date matching** for issue dates
- **Duplicate handling** during seeding
- **Input validation** and sanitization
- **Error handling** with detailed logging
- **TypeScript support** throughout

## Error Handling

The system handles various error scenarios:
- Invalid date formats
- Missing required fields
- Database connection issues
- Duplicate certificate numbers
- File not found errors

## Notes

- String matching uses `mode: "insensitive"` for case-insensitive searches
- Input is automatically trimmed before processing
- Date parsing supports multiple formats
- Excel date serial numbers are automatically converted
- The system logs skipped rows and duplicate entries during seeding
