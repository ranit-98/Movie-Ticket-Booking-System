import { Response } from 'express';
import { ApiResponse } from '../types/index';

export class ResponseHelper {
  static success<T>(
    res: Response,
    message: string,
    data?: T,
    statusCode: number = 200
  ): Response {
    const response: ApiResponse<T> = {
      success: true,
      message,
      data
    };
    return res.status(statusCode).json(response);
  }

  static error(
    res: Response,
    message: string,
    error?: string,
    statusCode: number = 400,
    errors?: any[]
  ): Response {
    const response: ApiResponse = {
      success: false,
      message,
      error,
      errors
    };
    return res.status(statusCode).json(response);
  }

  static created<T>(
    res: Response,
    message: string,
    data?: T
  ): Response {
    return this.success(res, message, data, 201);
  }

  static notFound(
    res: Response,
    message: string = 'Resource not found'
  ): Response {
    return this.error(res, message, undefined, 404);
  }

  static unauthorized(
    res: Response,
    message: string = 'Unauthorized access'
  ): Response {
    return this.error(res, message, undefined, 401);
  }

  static forbidden(
    res: Response,
    message: string = 'Access forbidden'
  ): Response {
    return this.error(res, message, undefined, 403);
  }

  static validationError(
    res: Response,
    message: string = 'Validation failed',
    errors?: any[]
  ): Response {
    return this.error(res, message, undefined, 422, errors);
  }

  static serverError(
    res: Response,
    message: string = 'Internal server error',
    error?: string
  ): Response {
    return this.error(res, message, error, 500);
  }

  static paginated<T>(
    res: Response,
    message: string,
    data: T[],
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    }
  ): Response {
    const response: ApiResponse<T[]> = {
      success: true,
      message,
      data,
      pagination
    };
    return res.status(200).json(response);
  }
}