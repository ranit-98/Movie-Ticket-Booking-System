import { User, IUser } from '../models/User';
import { SignupRequest, UpdateProfileRequest } from '../types';
import { FilterQuery } from 'mongoose';

export class UserRepository {
  async create(userData: SignupRequest): Promise<IUser> {
    const user = new User(userData);
    return await user.save();
  }

  async findById(id: string): Promise<IUser | null> {
    return await User.findById(id);
  }

  async findByEmail(email: string): Promise<IUser | null> {
    return await User.findOne({ email }).select('+password');
  }

  async findByEmailVerificationToken(token: string): Promise<IUser | null> {
    return await User.findOne({ emailVerificationToken: token });
  }

  async findByPasswordResetToken(token: string): Promise<IUser | null> {
    return await User.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: Date.now() }
    });
  }

  async update(id: string, updateData: Partial<IUser>): Promise<IUser | null> {
    return await User.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );
  }

  async updateProfile(id: string, profileData: UpdateProfileRequest): Promise<IUser | null> {
    return await User.findByIdAndUpdate(
      id,
      profileData,
      { new: true, runValidators: true }
    );
  }

  async updatePassword(id: string, newPassword: string): Promise<IUser | null> {
    const user = await User.findById(id);
    if (!user) return null;
    
    user.password = newPassword;
    return await user.save();
  }

  async setEmailVerificationToken(id: string, token: string): Promise<IUser | null> {
    return await User.findByIdAndUpdate(
      id,
      { emailVerificationToken: token },
      { new: true }
    );
  }

  async verifyEmail(token: string): Promise<IUser | null> {
    return await User.findOneAndUpdate(
      { emailVerificationToken: token },
      {
        isEmailVerified: true,
        $unset: { emailVerificationToken: 1 }
      },
      { new: true }
    );
  }

  async setPasswordResetToken(email: string, token: string, expires: Date): Promise<IUser | null> {
    return await User.findOneAndUpdate(
      { email },
      {
        passwordResetToken: token,
        passwordResetExpires: expires
      },
      { new: true }
    );
  }

  async resetPassword(token: string, newPassword: string): Promise<IUser | null> {
    const user = await User.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: Date.now() }
    });

    if (!user) return null;

    user.password = newPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    
    return await user.save();
  }

  async updateProfilePicture(id: string, profilePicture: string): Promise<IUser | null> {
    return await User.findByIdAndUpdate(
      id,
      { profilePicture },
      { new: true }
    );
  }

  async delete(id: string): Promise<boolean> {
    const result = await User.findByIdAndDelete(id);
    return !!result;
  }

  async find(query: FilterQuery<IUser> = {}, limit?: number, skip?: number): Promise<IUser[]> {
    let queryBuilder = User.find(query);
    
    if (skip) queryBuilder = queryBuilder.skip(skip);
    if (limit) queryBuilder = queryBuilder.limit(limit);
    
    return await queryBuilder.exec();
  }

  async count(query: FilterQuery<IUser> = {}): Promise<number> {
    return await User.countDocuments(query);
  }

  async exists(query: FilterQuery<IUser>): Promise<boolean> {
    const result = await User.findOne(query);
    return !!result;
  }
}