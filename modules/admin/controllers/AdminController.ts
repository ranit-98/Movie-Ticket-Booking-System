import { Request, Response } from 'express';
import { AdminService } from '../services/AdminService';
import { ResponseHelper } from '../../../shared/utils/responseHelper';
import { asyncHandler } from '../../../shared/middleware/errorHandler';
import { AuthenticatedRequest } from '../../../shared/types';

export class AdminController {
  private adminService: AdminService;

  constructor() {
    this.adminService = new AdminService();
  }

  getDashboard = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const dashboard = await this.adminService.getDashboardData();
    ResponseHelper.success(res, 'Dashboard data retrieved successfully', dashboard);
  });

  getUsers = asyncHandler(async (req: Request, res: Response) => {
    const { page, limit, search, role, isEmailVerified } = req.query as any;
    
    const searchQuery = {
      ...(search && { search }),
      ...(role && { role }),
      ...(isEmailVerified !== undefined && { isEmailVerified: isEmailVerified === 'true' })
    };

    const pagination = { page: parseInt(page) || 1, limit: parseInt(limit) || 10 };

    const result = await this.adminService.getUsers(searchQuery, pagination);
    ResponseHelper.paginated(res, 'Users retrieved successfully', result.users, result.pagination);
  });

  getUserById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const user = await this.adminService.getUserById(id);
    ResponseHelper.success(res, 'User retrieved successfully', user);
  });

  updateUserStatus = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { isEmailVerified, isActive } = req.body;
    
    const user = await this.adminService.updateUserStatus(id, { isEmailVerified, isActive });
    ResponseHelper.success(res, 'User status updated successfully', user);
  });

  deleteUser = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await this.adminService.deleteUser(id);
    ResponseHelper.success(res, result.message);
  });

  getSystemOverview = asyncHandler(async (req: Request, res: Response) => {
    const overview = await this.adminService.getSystemOverview();
    ResponseHelper.success(res, 'System overview retrieved successfully', overview);
  });

  getRevenueStats = asyncHandler(async (req: Request, res: Response) => {
    const { period = '30' } = req.query as any;
    const stats = await this.adminService.getRevenueStats(parseInt(period));
    ResponseHelper.success(res, 'Revenue statistics retrieved successfully', stats);
  });
}