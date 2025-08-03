import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../../modules/auth/models/User';
import { AuthenticatedRequest, JWTPayload, UserRole } from '../../shared/types/index';
import { ResponseHelper } from '../../shared/utils/responseHelper';
import { asyncHandler } from './errorHandler';

export const authenticate = asyncHandler(async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    ResponseHelper.unauthorized(res, 'Access denied. No token provided.');
    return;
  }

  try {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      ResponseHelper.error(res, 'JWT secret is not configured', '500');
      return;
    }

    const decoded = jwt.verify(token, jwtSecret) as JWTPayload;
    
    // Check if user still exists
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      ResponseHelper.unauthorized(res, 'User no longer exists.');
      return;
    }

    // Check if user account is verified
    if (!user.isEmailVerified) {
      ResponseHelper.unauthorized(res, 'Please verify your email first.');
      return;
    }

    req.user = {
      id: (user._id as any).toString(), // Type assertion to fix _id type issue
      email: user.email,
      role: user.role
    };

    next();
  } catch (error) {
    ResponseHelper.unauthorized(res, 'Invalid token.');
    return;
  }
});

export const authorize = (...roles: UserRole[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      ResponseHelper.unauthorized(res, 'Access denied. Please authenticate.');
      return;
    }

    if (!roles.includes(req.user.role as UserRole)) {
      ResponseHelper.forbidden(res, 'Access denied. Insufficient permissions.');
      return;
    }

    next();
  };
};

export const optionalAuth = asyncHandler(async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (token) {
    try {
      const jwtSecret = process.env.JWT_SECRET;
      if (jwtSecret) {
        const decoded = jwt.verify(token, jwtSecret) as JWTPayload;
        const user = await User.findById(decoded.id).select('-password');
        
        if (user && user.isEmailVerified) {
          req.user = {
            id: (user._id as any).toString(), // Type assertion to fix _id type issue
            email: user.email,
            role: user.role
          };
        }
      }
    } catch (error) {
      // Continue without user if token is invalid
    }
  }

  next();
});