import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { authenticate } from '../../../shared/middleware/auth';
import { uploadImage } from '../../../shared/utils/fileUpload';
import {
  validateSignup,
  validateLogin,
  validateUpdateProfile,
  validateChangePassword,
  validateForgotPassword,
  validateResetPassword,
  validateVerifyEmail,
  validateRefreshToken
} from '../middleware/validation';

const router = Router();
const authController = new AuthController();

// Public routes
router.post('/signup', validateSignup, authController.signup);
router.post('/login', validateLogin, authController.login);
router.post('/verify-email', validateVerifyEmail, authController.verifyEmail);
router.post('/resend-verification', validateForgotPassword, authController.resendVerificationEmail);
router.post('/forgot-password', validateForgotPassword, authController.forgotPassword);
router.post('/reset-password', validateResetPassword, authController.resetPassword);
router.post('/refresh-token', validateRefreshToken, authController.refreshToken);

// Protected routes
router.use(authenticate); // All routes below require authentication

router.get('/profile', authController.getProfile);
router.put('/profile', validateUpdateProfile, authController.updateProfile);
router.post('/profile/picture', uploadImage.single('profilePicture'), authController.uploadProfilePicture);
router.put('/change-password', validateChangePassword, authController.changePassword);
router.post('/logout', authController.logout);

export default router;