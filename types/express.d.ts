// TypeScript declaration file for Express with Multer support
import { Request, Response, NextFunction } from 'express';

declare global {
  namespace Express {
    interface Request {
      file?: Express.Multer.File;
      files?: Express.Multer.File[] | { [fieldname: string]: Express.Multer.File[] };
    }
  }
}

// Re-export Express types to make them available
export { Request, Response, NextFunction } from 'express';
export { Router } from 'express';

export {};
