import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Extend the Request interface to include user information
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
        firstName?: string;
        lastName?: string;
      };
    }
  }
}

/**
 * Authentication middleware to verify JWT tokens
 * Adds user information to the request object if token is valid
 */
export const authenticate = async (
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void> => {
  try {
    console.log('Authentication middleware called for:', req.method, req.path);
    console.log('Query parameters:', req.query);
    
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    console.log('Auth header:', authHeader ? 'present' : 'missing');
    
    if (!authHeader) {
      console.log('No auth header found - returning 401');
      res.status(401).json({
        success: false,
        message: 'Access token is required'
      });
      return;
    }

    // Extract token from "Bearer <token>"
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Invalid authorization header format. Use: Bearer <token>'
      });
      return;
    }

    // Verify JWT token
    const secretKey = process.env.JWT_SECRET || 'default_secret_key';
    
    try {
      const decoded = jwt.verify(token, secretKey) as {
        id: string;
        email: string;
        role: string;
      };

      // Verify user still exists in database
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: {
          id: true,
          email: true,
          role: true,
          firstName: true,
          lastName: true,
          isActive: true
        }
      });

      if (!user) {
        res.status(401).json({
          success: false,
          message: 'User not found'
        });
        return;
      }

      if (!user.isActive) {
        res.status(401).json({
          success: false,
          message: 'Account is deactivated'
        });
        return;
      }

      // Add user information to request object
      req.user = {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.firstName || undefined,
        lastName: user.lastName || undefined
      };

      next();
    } catch (jwtError) {
      res.status(401).json({
        success: false,
        message: 'Invalid or expired token'
      });
      return;
    }
  } catch (error) {
    console.error('Authentication middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during authentication'
    });
    return;
  }
};

/**
 * Authorization middleware to check user roles
 * Must be used after authenticate middleware
 */
export const authorize = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: `Access denied. Required roles: ${allowedRoles.join(', ')}`
      });
      return;
    }

    next();
  };
};

/**
 * Optional authentication middleware
 * Adds user info to request if token is provided and valid, but doesn't require it
 */
export const optionalAuth = async (
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No token provided, continue without authentication
      next();
      return;
    }

    const token = authHeader.split(' ')[1];
    const secretKey = process.env.JWT_SECRET || 'default_secret_key';
    
    try {
      const decoded = jwt.verify(token, secretKey) as {
        id: string;
        email: string;
        role: string;
      };

      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: {
          id: true,
          email: true,
          role: true,
          firstName: true,
          lastName: true,
          isActive: true
        }
      });

      if (user && user.isActive) {
        req.user = {
          id: user.id,
          email: user.email,
          role: user.role,
          firstName: user.firstName || undefined,
          lastName: user.lastName || undefined
        };
      }
    } catch (jwtError) {
      // Invalid token, but we don't throw error in optional auth
      console.log('Invalid token in optional auth:', jwtError);
    }

    next();
  } catch (error) {
    console.error('Optional auth middleware error:', error);
    next(); // Continue even if there's an error
  }
};

/**
 * Middleware to check if user owns the resource
 * Compares req.user.id with req.params.userId or req.params.id
 */
export const requireOwnership = (
  req: Request, 
  res: Response, 
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
    return;
  }

  const resourceUserId = req.params.userId || req.params.id;
  
  if (!resourceUserId) {
    res.status(400).json({
      success: false,
      message: 'Resource ID not found in request parameters'
    });
    return;
  }

  // Admins can access any resource
  if (req.user.role === 'ADMIN') {
    next();
    return;
  }

  // Check if user owns the resource
  if (req.user.id !== resourceUserId) {
    res.status(403).json({
      success: false,
      message: 'Access denied. You can only access your own resources'
    });
    return;
  }

  next();
};

/**
 * Rate limiting middleware (basic implementation)
 * Limits requests per user per time window
 */
const requestCounts = new Map<string, { count: number; resetTime: number }>();

export const rateLimit = (maxRequests: number = 100, windowMs: number = 15 * 60 * 1000) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const userId = req.user?.id || req.ip || 'anonymous';
    const now = Date.now();
    
    // Clean up expired entries
    for (const [key, value] of requestCounts.entries()) {
      if (now > value.resetTime) {
        requestCounts.delete(key);
      }
    }
    
    const userRequests = requestCounts.get(userId);
    
    if (!userRequests) {
      requestCounts.set(userId, { count: 1, resetTime: now + windowMs });
      next();
      return;
    }
    
    if (now > userRequests.resetTime) {
      requestCounts.set(userId, { count: 1, resetTime: now + windowMs });
      next();
      return;
    }
    
    if (userRequests.count >= maxRequests) {
      res.status(429).json({
        success: false,
        message: 'Too many requests. Please try again later.',
        retryAfter: Math.ceil((userRequests.resetTime - now) / 1000)
      });
      return;
    }
    
    userRequests.count++;
    next();
  };
};

export default {
  authenticate,
  authorize,
  optionalAuth,
  requireOwnership,
  rateLimit
};