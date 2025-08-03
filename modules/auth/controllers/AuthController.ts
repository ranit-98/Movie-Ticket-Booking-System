import { Request, Response } from 'express';
import { AuthService } from '../services/AuthService';
import { asyncHandler } from '../../../shared/middleware/errorHandler';
import { getFileUrl, ResponseHelper } from '../../../shared/utils';
import { AuthenticatedRequest } from '../../../shared/types';


export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  signup = asyncHandler(async (req: Request, res: Response) => {
    const result = await this.authService.signup(req.body);
    ResponseHelper.created(res, result.message, { userId: result.userId });
  });

  login = asyncHandler(async (req: Request, res: Response) => {
    const result = await this.authService.login(req.body);
    ResponseHelper.success(res, 'Login successful', result);
  });

  verifyEmail = asyncHandler(async (req: Request, res: Response) => {
    const { token } = req.body;
    const result = await this.authService.verifyEmail(token);
    ResponseHelper.success(res, result.message);
  });

  resendVerificationEmail = asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.body;
    const result = await this.authService.resendVerificationEmail(email);
    ResponseHelper.success(res, result.message);
  });

  getProfile = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const profile = await this.authService.getProfile(userId);
    ResponseHelper.success(res, 'Profile retrieved successfully', profile);
  });

  updateProfile = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const profile = await this.authService.updateProfile(userId, req.body);
    ResponseHelper.success(res, 'Profile updated successfully', profile);
  });

uploadProfilePicture = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  
  if (!req.file) {
    return ResponseHelper.error(res, 'No file uploaded', undefined, 400);
  }

  const profilePictureUrl = getFileUrl(req.file.filename, 'profiles');
  const profile = await this.authService.updateProfilePicture(userId, profilePictureUrl);
  
  return ResponseHelper.success(res, 'Profile picture updated successfully', profile);
});

  changePassword = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const result = await this.authService.changePassword(userId, req.body);
    ResponseHelper.success(res, result.message);
  });

  forgotPassword = asyncHandler(async (req: Request, res: Response) => {
    const result = await this.authService.forgotPassword(req.body);
    ResponseHelper.success(res, result.message);
  });

  resetPassword = asyncHandler(async (req: Request, res: Response) => {
    const result = await this.authService.resetPassword(req.body);
    ResponseHelper.success(res, result.message);
  });

  refreshToken = asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.body;
    const tokens = await this.authService.refreshToken(refreshToken);
    ResponseHelper.success(res, 'Tokens refreshed successfully', tokens);
  });

  logout = asyncHandler(async (req: Request, res: Response) => {
    // In a real application, you might want to blacklist the token
    ResponseHelper.success(res, 'Logged out successfully');
  })}