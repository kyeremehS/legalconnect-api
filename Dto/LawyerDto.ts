import { z } from 'zod';

// Zod schema for creating a lawyer
export const createLawyerDto = z.object({
    userId: z.string().min(1, 'User ID is required'),
    
    professionalSummary: z
        .string()
        .max(1000, 'Professional summary must be no more than 1000 characters')
        .optional(),
    
    firm: z
        .string()
        .min(1, 'Firm name is required')
        .max(200, 'Firm name must be no more than 200 characters'),
    
    location: z
        .string()
        .max(100, 'Location must be no more than 100 characters')
        .optional(),
    
    barAdmissionYear: z
        .string()
        .max(4, 'Bar admission year must be valid')
        .optional(),
    
    experience: z
        .number()
        .min(0, 'Experience must be a positive number')
        .max(60, 'Experience must be reasonable')
        .optional(),
    
    practiceAreas: z
        .array(z.string())
        .min(1, 'At least one practice area is required'),
    
    education: z
        .string()
        .max(500, 'Education must be no more than 500 characters')
        .optional(),
    
    barAssociation: z
        .string()
        .max(200, 'Bar association must be no more than 200 characters')
        .optional(),
    
    website: z
        .string()
        .url('Website must be a valid URL')
        .optional(),
    
    specializations: z
        .array(z.string())
        .default([]),
    
    languages: z
        .array(z.string())
        .min(1, 'At least one language is required')
});

// Zod schema for updating a lawyer
export const updateLawyerDto = z.object({
    professionalSummary: z
        .string()
        .max(1000, 'Professional summary must be no more than 1000 characters')
        .optional(),
    
    firm: z
        .string()
        .min(1, 'Firm name is required')
        .max(200, 'Firm name must be no more than 200 characters')
        .optional(),
    
    location: z
        .string()
        .max(100, 'Location must be no more than 100 characters')
        .optional(),
    
    barAdmissionYear: z
        .string()
        .max(4, 'Bar admission year must be valid')
        .optional(),
    
    experience: z
        .number()
        .min(0, 'Experience must be a positive number')
        .max(60, 'Experience must be reasonable')
        .optional(),
    
    practiceAreas: z
        .array(z.string())
        .optional(),
    
    education: z
        .string()
        .max(500, 'Education must be no more than 500 characters')
        .optional(),
    
    barAssociation: z
        .string()
        .max(200, 'Bar association must be no more than 200 characters')
        .optional(),
    
    website: z
        .string()
        .url('Website must be a valid URL')
        .optional(),
    
    specializations: z
        .array(z.string())
        .optional(),
    
    languages: z
        .array(z.string())
        .optional()
});

// Zod schema for lawyer ID parameter validation
export const lawyerParamsDto = z.object({
    id: z.string().min(1, 'Lawyer ID is required')
});

// Zod schema for user ID parameter validation
export const userIdParamsDto = z.object({
    userId: z.string().min(1, 'User ID is required')
});

// Type inference from DTOs
export type CreateLawyerInput = z.infer<typeof createLawyerDto>;
export type UpdateLawyerInput = z.infer<typeof updateLawyerDto>;
export type LawyerParamsInput = z.infer<typeof lawyerParamsDto>;
export type UserIdParamsInput = z.infer<typeof userIdParamsDto>;
