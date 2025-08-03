import { Request } from 'express';
import { Document } from 'mongoose';

// Common response structure
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  errors?: any[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Extended Request interface for authenticated routes
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: 'user' | 'admin';
  };
}

// User role enum
export enum UserRole {
  USER = 'user',
  ADMIN = 'admin'
}

// Common database document interface
export interface BaseDocument extends Document {
  createdAt: Date;
  updatedAt: Date;
}

// Pagination query parameters
export interface PaginationQuery {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

// File upload interface
export interface UploadedFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  destination: string;
  filename: string;
  path: string;
  size: number;
}

// Generic filter interface
export interface FilterQuery {
  [key: string]: any;
}

// Email template data
export interface EmailData {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

// JWT Payload interface
export interface JWTPayload {
  id: string;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}