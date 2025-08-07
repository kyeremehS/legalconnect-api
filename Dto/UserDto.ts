import { z } from 'zod';

// Zod schema for user registration
export const registerUserDto = z.object({
    firstName: z
        .string()
        .min(1, 'firstName is required')
        .max(50, 'firstName must be no more than 50 characters long'),
    
    lastName: z
        .string()
        .min(1, 'lastName is required')
        .max(50, 'lastName must be no more than 50 characters long'),
    
    email: z
        .string()
        .email('email must be a valid email address'),
    username: z
        .string()
        .min(3, 'username must be at least 3 characters long')
        .max(30, 'username must be no more than 30 characters long'),

    role: z.enum(['CLIENT', 'LAWYER', 'ADMIN']),
    
    password: z
        .string()
        .min(8, 'password must be at least 8 characters long')
});

// Zod schema for user updates
export const updateUserDto = z.object({
    firstName: z
        .string()
        .min(1, 'firstName must not be empty')
        .max(50, 'firstName must be no more than 50 characters long')
        .optional(),
    
    lastName: z
        .string()
        .min(1, 'lastName must not be empty')
        .max(50, 'lastName must be no more than 50 characters long')
        .optional(),
    
    email: z
        .string()
        .email('email must be a valid email address')
        .optional(),
    
    phone: z
        .string()
        .optional(),
    
    role: z
        .enum(['CLIENT', 'LAWYER', 'ADMIN', 'CONSULTANT'])
        .optional(),
    
    status: z
        .enum(['ACTIVE', 'SUSPENDED', 'INACTIVE', 'PENDING_VERIFICATION'])
        .optional(),
    
    isActive: z
        .boolean()
        .optional(),
    
    isVerified: z
        .boolean()
        .optional()
});

// Zod schema for user ID parameter validation
export const userParamsDto = z.object({
    id: z.string().min(1, 'User ID is required')
});

export const loginDto = z.object({
    email: z
        .string()
        .email('email must be a valid email address'),
    password: z
        .string()
        .min(8, 'password must be at least 8 characters long')
});

// Type inference from DTOs
export type RegisterUserInput = z.infer<typeof registerUserDto>;
export type UpdateUserInput = z.infer<typeof updateUserDto>;
export type UserParamsInput = z.infer<typeof userParamsDto>;