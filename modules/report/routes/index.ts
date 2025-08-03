import { Router } from 'express';
import { ReportController } from '../controllers/ReportController';
import { authenticate, authorize } from '../../../shared/middleware/auth';
import { UserRole } from '../../../shared/types/index';

const router = Router();
const reportController = new ReportController();

// All report routes require authentication
router.use(authenticate);

// User routes
router.post('/booking-summary/email', reportController.sendBookingSummaryEmail);

// Admin routes
router.use(authorize(UserRole.ADMIN));

router.get('/movies', reportController.getMoviesWithBookings);
router.get('/theaters', reportController.getBookingsByTheater);
router.get('/revenue', reportController.generateRevenueReport);
router.get('/popular-movies', reportController.getPopularMovies);
router.get('/popular-theaters', reportController.getPopularTheaters);
router.get('/user-analytics', reportController.getUserAnalytics);

export default router;