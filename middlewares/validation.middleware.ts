import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

export interface ValidationError {
    field: string;
    message: string;
}

export const validateSchema = (schema: ZodSchema) => {
    return (req: Request, res: Response, next: NextFunction) => {
        try {
            // Validate the request body against the schema
            const validatedData = schema.parse(req.body);
            
            // Replace req.body with validated data (this ensures type safety)
            req.body = validatedData;
            
            next();
        } catch (error) {
            if (error instanceof ZodError) {
                // Format Zod errors to match your API error format
                const validationErrors: ValidationError[] = (error as ZodError<any>).issues.map((err) => ({
                    field: err.path.join('.'),
                    message: err.message
                }));

                return res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: validationErrors
                });
            }

            // Handle unexpected errors
            console.error('Validation middleware error:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error during validation'
            });
        }
    };
};

// Middleware for validating params (like user ID)
export const validateParams = (schema: ZodSchema) => {
    return (req: Request, res: Response, next: NextFunction) => {
        try {
            const validatedParams = schema.parse(req.params);
            req.params = validatedParams as any;
            next();
        } catch (error) {
            if (error instanceof ZodError) {
                const validationErrors: ValidationError[] = (error as ZodError<any>).issues.map((err) => ({
                    field: err.path.join('.'),
                    message: err.message
                }));

                return res.status(400).json({
                    success: false,
                    message: 'Invalid parameters',
                    errors: validationErrors
                });
            }

            console.error('Params validation error:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error during parameter validation'
            });
        }
    };
};

// Middleware for validating query parameters
export const validateQuery = (schema: ZodSchema) => {
    return (req: Request, res: Response, next: NextFunction) => {
        try {
            const validatedQuery = schema.parse(req.query);
            req.query = validatedQuery as any;
            next();
        } catch (error) {
            if (error instanceof ZodError) {
                const validationErrors: ValidationError[] = (error as ZodError<any>).issues.map((err) => ({
                    field: err.path.join('.'),
                    message: err.message
                }));

                return res.status(400).json({
                    success: false,
                    message: 'Invalid query parameters',
                    errors: validationErrors
                });
            }

            console.error('Query validation error:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error during query validation'
            });
        }
    };
};
