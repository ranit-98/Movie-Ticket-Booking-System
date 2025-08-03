import { Router } from 'express';
import { AdminController } from '../controllers/AdminController';
import { authenticate, authorize } from '../../../shared/middleware/auth';
import { UserRole } from '../../../shared/types/index';

const router = Router();
const adminController = new AdminController();

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(authorize(UserRole.ADMIN));

// Dashboard
router.get('/dashboard', adminController.getDashboard);

// User management
router.get('/users', adminController.getUsers);
router.get('/users/:id', adminController.getUserById);
router.put('/users/:id/status', adminController.updateUserStatus);
router.delete('/users/:id', adminController.deleteUser);

// System statistics
router.get('/stats/overview', adminController.getSystemOverview);
router.get('/stats/revenue', adminController.getRevenueStats);

export default router;