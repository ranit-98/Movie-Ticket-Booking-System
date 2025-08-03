import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { UserRepository } from '../repositories/UserRepository';
import { emailService } from '../../../shared/utils/emailService';
import { createError } from '../../../shared/middleware/errorHandler';
import { 
  SignupRequest, 
  LoginRequest, 
  AuthResponse, 
  UpdateProfileRequest, 
  ChangePasswordRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest
} from '../types';
import { IUser } from '../models/User';
import { JWTPayload } from '../../../shared/types/index';

export class AuthService {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  private generateTokens(user: IUser): { token: string; refreshToken: string } {
    const payload: JWTPayload = {
      id: (user._id as any).toString(), // Type assertion to fix _id type issue
      email: user.email,
      role: user.role
    };

    // Ensure JWT secrets are defined
    const jwtSecret = process.env.JWT_SECRET;
    const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET;

    if (!jwtSecret || !jwtRefreshSecret) {
      throw createError('JWT secrets are not configured', 500);
    }

    // Use explicit type casting to fix JWT signing issues
    const token = jwt.sign(
      payload, 
      jwtSecret as jwt.Secret,
      {
        expiresIn: process.env.JWT_EXPIRES_IN || '7d'
      } as jwt.SignOptions
    );

    const refreshToken = jwt.sign(
      payload, 
      jwtRefreshSecret as jwt.Secret,
      {
        expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d'
      } as jwt.SignOptions
    );

    return { token, refreshToken };
  }

  private formatUserResponse(user: IUser): AuthResponse['user'] {
    return {
      id: (user._id as any).toString(), // Type assertion to fix _id type issue
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      dateOfBirth: user.dateOfBirth,
      profilePicture: user.profilePicture,
      role: user.role,
      isEmailVerified: user.isEmailVerified
    };
  }

  async signup(signupData: SignupRequest): Promise<{ message: string; userId: string }> {
    const { email, password, confirmPassword, ...userData } = signupData;

    // Check if passwords match
    if (password !== confirmPassword) {
      throw createError('Passwords do not match', 400);
    }

    // Check if user already exists
    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      throw createError('User already exists with this email', 400);
    }

    // Create user
    const user = await this.userRepository.create({
      ...userData,
      email,
      password,
      confirmPassword
    });

    // Generate email verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    await this.userRepository.setEmailVerificationToken((user._id as any).toString(), verificationToken);

    // Send verification email
    await emailService.sendVerificationEmail(email, verificationToken);

    return {
      message: 'User registered successfully. Please check your email for verification.',
      userId: (user._id as any).toString() // Type assertion to fix _id type issue
    };
  }

  async login(loginData: LoginRequest): Promise<AuthResponse> {
    const { email, password } = loginData;

    // Find user with password
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw createError('Invalid email or password', 401);
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw createError('Invalid email or password', 401);
    }

    // Check if email is verified
    if (!user.isEmailVerified) {
      throw createError('Please verify your email before logging in', 401);
    }

    // Generate tokens
    const { token, refreshToken } = this.generateTokens(user);

    return {
      user: this.formatUserResponse(user),
      token,
      refreshToken
    };
  }

  async verifyEmail(token: string): Promise<{ message: string }> {
    const user = await this.userRepository.verifyEmail(token);
    if (!user) {
      throw createError('Invalid or expired verification token', 400);
    }

    return { message: 'Email verified successfully' };
  }

  async resendVerificationEmail(email: string): Promise<{ message: string }> {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw createError('User not found', 404);
    }

    if (user.isEmailVerified) {
      throw createError('Email is already verified', 400);
    }

    // Generate new verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    await this.userRepository.setEmailVerificationToken((user._id as any).toString(), verificationToken);

    // Send verification email
    await emailService.sendVerificationEmail(email, verificationToken);

    return { message: 'Verification email sent successfully' };
  }

  async getProfile(userId: string): Promise<AuthResponse['user']> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw createError('User not found', 404);
    }

    return this.formatUserResponse(user);
  }

  async updateProfile(userId: string, profileData: UpdateProfileRequest): Promise<AuthResponse['user']> {
    const user = await this.userRepository.updateProfile(userId, profileData);
    if (!user) {
      throw createError('User not found', 404);
    }

    return this.formatUserResponse(user);
  }

  async updateProfilePicture(userId: string, profilePicture: string): Promise<AuthResponse['user']> {
    const user = await this.userRepository.updateProfilePicture(userId, profilePicture);
    if (!user) {
      throw createError('User not found', 404);
    }

    return this.formatUserResponse(user);
  }

  async changePassword(userId: string, passwordData: ChangePasswordRequest): Promise<{ message: string }> {
    const { currentPassword, newPassword, confirmPassword } = passwordData;

    if (newPassword !== confirmPassword) {
      throw createError('New passwords do not match', 400);
    }

    const user = await this.userRepository.findByEmail((await this.userRepository.findById(userId))?.email!);
    if (!user) {
      throw createError('User not found', 404);
    }

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      throw createError('Current password is incorrect', 400);
    }

    // Update password
    await this.userRepository.updatePassword(userId, newPassword);

    return { message: 'Password changed successfully' };
  }

  async forgotPassword(forgotPasswordData: ForgotPasswordRequest): Promise<{ message: string }> {
    const { email } = forgotPasswordData;

    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      // Don't reveal that user doesn't exist
      return { message: 'If your email is registered, you will receive a password reset link' };
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await this.userRepository.setPasswordResetToken(email, resetToken, resetExpires);

    // Send password reset email
    await emailService.sendPasswordResetEmail(email, resetToken);

    return { message: 'If your email is registered, you will receive a password reset link' };
  }

  async resetPassword(resetPasswordData: ResetPasswordRequest): Promise<{ message: string }> {
    const { token, newPassword, confirmPassword } = resetPasswordData;

    if (newPassword !== confirmPassword) {
      throw createError('Passwords do not match', 400);
    }

    const user = await this.userRepository.resetPassword(token, newPassword);
    if (!user) {
      throw createError('Invalid or expired reset token', 400);
    }

    return { message: 'Password reset successfully' };
  }

  async refreshToken(refreshToken: string): Promise<{ token: string; refreshToken: string }> {
    try {
      const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET;
      
      if (!jwtRefreshSecret) {
        throw createError('JWT refresh secret is not configured', 500);
      }

      const decoded = jwt.verify(refreshToken, jwtRefreshSecret as jwt.Secret) as JWTPayload;
      
      const user = await this.userRepository.findById(decoded.id);
      if (!user) {
        throw createError('User not found', 404);
      }

      return this.generateTokens(user);
    } catch (error) {
      throw createError('Invalid refresh token', 401);
    }
  }
}