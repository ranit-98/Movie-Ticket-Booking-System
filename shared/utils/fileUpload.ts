import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request } from 'express';
import { createError } from '../middleware/errorHandler';

// Ensure upload directory exists
const uploadDir = process.env.UPLOAD_PATH || './public/uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Storage configuration
const storage = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, cb) => {
    let subDir = 'general';
    
    // Determine subdirectory based on file type or route
    if (file.fieldname === 'profilePicture') {
      subDir = 'profiles';
    } else if (file.fieldname === 'moviePoster') {
      subDir = 'movies';
    }
    
    const fullPath = path.join(uploadDir, subDir);
    
    // Create subdirectory if it doesn't exist
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
    }
    
    cb(null, fullPath);
  },
  filename: (req: Request, file: Express.Multer.File, cb) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const name = file.fieldname + '-' + uniqueSuffix + ext;
    cb(null, name);
  }
});

// File filter for images
const imageFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(createError('Only image files (JPEG, JPG, PNG, GIF, WebP) are allowed', 400));
  }
};

// File filter for documents
const documentFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = /pdf|doc|docx|txt/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = /application\/(pdf|msword|vnd\.openxmlformats-officedocument\.wordprocessingml\.document)|text\/plain/.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(createError('Only document files (PDF, DOC, DOCX, TXT) are allowed', 400));
  }
};

// Upload configurations
export const uploadImage = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880'), // 5MB default
    files: 1
  },
  fileFilter: imageFilter
});

export const uploadDocument = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880'), // 5MB default
    files: 1
  },
  fileFilter: documentFilter
});

export const uploadAny = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880'), // 5MB default
    files: 5
  }
});

// Helper function to delete file
export const deleteFile = (filePath: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    fs.unlink(filePath, (err) => {
      if (err && err.code !== 'ENOENT') {
        reject(err);
      } else {
        resolve();
      }
    });
  });
};

// Helper function to get file URL
export const getFileUrl = (filename: string, subfolder: string = 'general'): string => {
  return `${process.env.API_BASE_URL}/public/uploads/${subfolder}/${filename}`;
};