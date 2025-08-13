# Example Excel File Structure

Create an Excel file named `lawyers in good standing.xlsx` with these exact column headers:

| Name of Lawyer | Date of Issue | Certificate Number |
|----------------|---------------|-------------------|
| John Doe | 2023-01-15 | CERT-001 |
| Jane Smith | 2022-12-20 | CERT-002 |
| Michael Johnson | 2023-03-10 | CERT-003 |

## Column Requirements:

1. **Name of Lawyer** (Required)
   - Full name of the lawyer
   - Text format
   - Case-insensitive matching

2. **Date of Issue** (Required)
   - Date when certificate was issued
   - Accepts various formats: YYYY-MM-DD, MM/DD/YYYY, etc.
   - Excel date format is also supported

3. **Certificate Number** (Required)
   - Unique identifier for the certificate
   - Text or number format
   - Must be unique across all records

## Notes:
- Column headers must match exactly (case-sensitive)
- Place this file in the `prisma/` directory
- Run `npm run seed` to import the data
- Rows with missing required fields will be skipped
