import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { ResponseHelper } from '../../../shared/utils/responseHelper';

// Validation schemas
const signupSchema = Joi.object({
  firstName: Joi.string().trim().min(1).max(50).required().messages({
    'string.empty': 'First name is required',
    'string.max': 'First name cannot exceed 50 characters'
  }),
  lastName: Joi.string().trim().min(1).max(50).required().messages({
    'string.empty': 'Last name is required',
    'string.max': 'Last name cannot exceed 50 characters'
  }),
  email: Joi.string().email().lowercase().required().messages({
    'string.email': 'Please provide a valid email address',
    'string.empty': 'Email is required'
  }),
  password: Joi.string().min(6).required().messages({
    'string.min': 'Password must be at least 6 characters long',
    'string.empty': 'Password is required'
  }),
  confirmPassword: Joi.string().valid(Joi.ref('password')).required().messages({
    'any.only': 'Passwords do not match',
    'string.empty': 'Confirm password is required'
  }),
  phone: Joi.string().pattern(/^\+?[\d\s-()]+$/).optional().messages({
    'string.pattern.base': 'Please provide a valid phone number'
  }),
  dateOfBirth: Joi.date().iso().optional()
});

const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'string.empty': 'Email is required'
  }),
  password: Joi.string().required().messages({
    'string.empty': 'Password is required'
  })
});

const updateProfileSchema = Joi.object({
  firstName: Joi.string().trim().min(1).max(50).optional().messages({
    'string.empty': 'First name cannot be empty',
    'string.max': 'First name cannot exceed 50 characters'
  }),
  lastName: Joi.string().trim().min(1).max(50).optional().messages({
    'string.empty': 'Last name cannot be empty',
    'string.max': 'Last name cannot exceed 50 characters'
  }),
  phone: Joi.string().pattern(/^\+?[\d\s-()]+$/).optional().allow('').messages({
    'string.pattern.base': 'Please provide a valid phone number'
  }),
  dateOfBirth: Joi.date().iso().optional().allow(null)
});

const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required().messages({
    'string.empty': 'Current password is required'
  }),
  newPassword: Joi.string().min(6).required().messages({
    'string.min': 'New password must be at least 6 characters long',
    'string.empty': 'New password is required'
  }),
  confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required().messages({
    'any.only': 'New passwords do not match',
    'string.empty': 'Confirm password is required'
  })
});

const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'string.empty': 'Email is required'
  })
});

const resetPasswordSchema = Joi.object({
  token: Joi.string().required().messages({
    'string.empty': 'Reset token is required'
  }),
  newPassword: Joi.string().min(6).required().messages({
    'string.min': 'Password must be at least 6 characters long',
    'string.empty': 'New password is required'
  }),
  confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required().messages({
    'any.only': 'Passwords do not match',
    'string.empty': 'Confirm password is required'
  })
});

const verifyEmailSchema = Joi.object({
  token: Joi.string().required().messages({
    'string.empty': 'Verification token is required'
  })
});

const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().required().messages({
    'string.empty': 'Refresh token is required'
  })
});

// Validation middleware generator
const validateRequest = (schema: Joi.Schema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error } = schema.validate(req.body, { abortEarly: false });
    
    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));
      
      return ResponseHelper.validationError(res, 'Validation failed', errors);
    }
    
    return next();
  };
};

// Export validation middlewares
export const validateSignup = validateRequest(signupSchema);
export const validateLogin = validateRequest(loginSchema);
export const validateUpdateProfile = validateRequest(updateProfileSchema);
export const validateChangePassword = validateRequest(changePasswordSchema);
export const validateForgotPassword = validateRequest(forgotPasswordSchema);
export const validateResetPassword = validateRequest(resetPasswordSchema);
export const validateVerifyEmail = validateRequest(verifyEmailSchema);
export const validateRefreshToken = validateRequest(refreshTokenSchema);