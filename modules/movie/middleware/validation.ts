import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { ResponseHelper } from '../../../shared/utils/responseHelper';

// Available genres
const availableGenres = [
  'Action', 'Adventure', 'Animation', 'Biography', 'Comedy', 'Crime',
  'Documentary', 'Drama', 'Family', 'Fantasy', 'History', 'Horror',
  'Music', 'Mystery', 'Romance', 'Sci-Fi', 'Sport', 'Thriller', 'War', 'Western'
];

// Validation schemas
const createMovieSchema = Joi.object({
  name: Joi.string().trim().min(1).max(200).required().messages({
    'string.empty': 'Movie name is required',
    'string.max': 'Movie name cannot exceed 200 characters'
  }),
  description: Joi.string().trim().max(2000).optional().allow('').messages({
    'string.max': 'Description cannot exceed 2000 characters'
  }),
  genre: Joi.array().items(
    Joi.string().valid(...availableGenres)
  ).min(1).required().messages({
    'array.min': 'At least one genre is required',
    'any.only': `Genre must be one of: ${availableGenres.join(', ')}`
  }),
  language: Joi.array().items(
    Joi.string().trim().min(1)
  ).min(1).required().messages({
    'array.min': 'At least one language is required'
  }),
  duration: Joi.number().integer().min(1).max(600).required().messages({
    'number.base': 'Duration must be a number',
    'number.min': 'Duration must be at least 1 minute',
    'number.max': 'Duration cannot exceed 600 minutes',
    'any.required': 'Duration is required'
  }),
  cast: Joi.array().items(
    Joi.string().trim().min(1)
  ).min(1).required().messages({
    'array.min': 'At least one cast member is required'
  }),
  director: Joi.string().trim().min(1).max(100).required().messages({
    'string.empty': 'Director is required',
    'string.max': 'Director name cannot exceed 100 characters'
  }),
  releaseDate: Joi.date().iso().required().messages({
    'date.base': 'Release date must be a valid date',
    'any.required': 'Release date is required'
  }),
  rating: Joi.number().min(0).max(10).optional().messages({
    'number.min': 'Rating cannot be less than 0',
    'number.max': 'Rating cannot be more than 10'
  })
});

const updateMovieSchema = Joi.object({
  name: Joi.string().trim().min(1).max(200).optional().messages({
    'string.empty': 'Movie name cannot be empty',
    'string.max': 'Movie name cannot exceed 200 characters'
  }),
  description: Joi.string().trim().max(2000).optional().allow('').messages({
    'string.max': 'Description cannot exceed 2000 characters'
  }),
  genre: Joi.array().items(
    Joi.string().valid(...availableGenres)
  ).min(1).optional().messages({
    'array.min': 'At least one genre is required',
    'any.only': `Genre must be one of: ${availableGenres.join(', ')}`
  }),
  language: Joi.array().items(
    Joi.string().trim().min(1)
  ).min(1).optional().messages({
    'array.min': 'At least one language is required'
  }),
  duration: Joi.number().integer().min(1).max(600).optional().messages({
    'number.base': 'Duration must be a number',
    'number.min': 'Duration must be at least 1 minute',
    'number.max': 'Duration cannot exceed 600 minutes'
  }),
  cast: Joi.array().items(
    Joi.string().trim().min(1)
  ).min(1).optional().messages({
    'array.min': 'At least one cast member is required'
  }),
  director: Joi.string().trim().min(1).max(100).optional().messages({
    'string.empty': 'Director cannot be empty',
    'string.max': 'Director name cannot exceed 100 characters'
  }),
  releaseDate: Joi.date().iso().optional().messages({
    'date.base': 'Release date must be a valid date'
  }),
  rating: Joi.number().min(0).max(10).optional().messages({
    'number.min': 'Rating cannot be less than 0',
    'number.max': 'Rating cannot be more than 10'
  }),
  isActive: Joi.boolean().optional()
});

const movieSearchSchema = Joi.object({
  name: Joi.string().trim().optional(),
  genre: Joi.alternatives().try(
    Joi.string().valid(...availableGenres),
    Joi.array().items(Joi.string().valid(...availableGenres))
  ).optional(),
  language: Joi.alternatives().try(
    Joi.string().trim(),
    Joi.array().items(Joi.string().trim())
  ).optional(),
  city: Joi.string().trim().optional(),
  releaseDateFrom: Joi.date().iso().optional(),
  releaseDateTo: Joi.date().iso().optional(),
  page: Joi.number().integer().min(1).optional().default(1),
  limit: Joi.number().integer().min(1).max(100).optional().default(10),
  sort: Joi.string().valid('name', 'releaseDate', 'rating', 'createdAt').optional().default('releaseDate'),
  order: Joi.string().valid('asc', 'desc').optional().default('desc')
});

// Validation middleware generator
const validateRequest = (schema: Joi.Schema, source: 'body' | 'query' = 'body') => {
  return (req: Request, res: Response, next: NextFunction) => {
    const dataToValidate = source === 'body' ? req.body : req.query;
    
    const { error, value } = schema.validate(dataToValidate, { 
      abortEarly: false,
      allowUnknown: true
    });
    
    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));
      
      return ResponseHelper.validationError(res, 'Validation failed', errors);
    }
    
    // Replace the original data with validated data
    if (source === 'body') {
      req.body = value;
    } else {
      req.query = value;
    }
    
   return  next();
  };
};

// Export validation middlewares
export const validateCreateMovie = validateRequest(createMovieSchema);
export const validateUpdateMovie = validateRequest(updateMovieSchema);
export const validateMovieSearch = validateRequest(movieSearchSchema, 'query');