import { Router } from 'express';
import { BookingController } from '../controllers/BookingController';
import { authenticate, authorize } from '../../../shared/middleware/auth';
import { UserRole } from '../../../shared/types';

const router = Router();
const bookingController = new BookingController();

// All booking routes require authentication
router.use(authenticate);

// User routes
router.post('/', bookingController.createBooking);
router.get('/my-bookings', bookingController.getUserBookings);
router.get('/my-summary', bookingController.getUserBookingSummary);
router.put('/:id/cancel', bookingController.cancelBooking);
router.get('/reference/:reference', bookingController.getBookingByReference);
router.get('/:id', bookingController.getBookingById);

// Admin routes
router.get('/', authorize(UserRole.ADMIN), bookingController.getBookings);
router.get('/reports/movies', authorize(UserRole.ADMIN), bookingController.getBookingsByMovie);
router.get('/reports/theaters', authorize(UserRole.ADMIN), bookingController.getBookingsByTheater);

export default router;