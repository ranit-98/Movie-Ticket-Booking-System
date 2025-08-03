import { Request, Response } from 'express';
import { BookingService } from '../services/BookingService';
import { ResponseHelper } from '../../../shared/utils/responseHelper';
import { asyncHandler } from '../../../shared/middleware/errorHandler';
import { AuthenticatedRequest } from '../../../shared/types';

export class BookingController {
  private bookingService: BookingService;

  constructor() {
    this.bookingService = new BookingService();
  }

  createBooking = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const booking = await this.bookingService.createBooking(req.body, userId);
    ResponseHelper.created(res, 'Booking created successfully', booking);
  });

  getBookings = asyncHandler(async (req: Request, res: Response) => {
    const { userId, movieId, theaterId, status, bookingDateFrom, bookingDateTo, showTimeFrom, showTimeTo, page, limit } = req.query as any;
    
    const searchQuery = {
      ...(userId && { userId }),
      ...(movieId && { movieId }),
      ...(theaterId && { theaterId }),
      ...(status && { status }),
      ...(bookingDateFrom && { bookingDateFrom: new Date(bookingDateFrom) }),
      ...(bookingDateTo && { bookingDateTo: new Date(bookingDateTo) }),
      ...(showTimeFrom && { showTimeFrom: new Date(showTimeFrom) }),
      ...(showTimeTo && { showTimeTo: new Date(showTimeTo) })
    };

    const pagination = { page: parseInt(page) || 1, limit: parseInt(limit) || 10 };

    const result = await this.bookingService.getBookings(searchQuery, pagination);
    ResponseHelper.paginated(res, 'Bookings retrieved successfully', result.bookings, result.pagination);
  });

  getBookingById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const booking = await this.bookingService.getBookingById(id);
    ResponseHelper.success(res, 'Booking retrieved successfully', booking);
  });

  getBookingByReference = asyncHandler(async (req: Request, res: Response) => {
    const { reference } = req.params;
    const booking = await this.bookingService.getBookingByReference(reference);
    ResponseHelper.success(res, 'Booking retrieved successfully', booking);
  });

  getUserBookings = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const { page, limit } = req.query as any;
    const pagination = { page: parseInt(page) || 1, limit: parseInt(limit) || 10 };

    const result = await this.bookingService.getUserBookings(userId, pagination);
    ResponseHelper.paginated(res, 'User bookings retrieved successfully', result.bookings, result.pagination);
  });

  cancelBooking = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const userId = req.user!.id;
    const result = await this.bookingService.cancelBooking(id, userId);
    ResponseHelper.success(res, result.message);
  });

  getBookingsByMovie = asyncHandler(async (req: Request, res: Response) => {
    const bookings = await this.bookingService.getBookingsByMovie();
    ResponseHelper.success(res, 'Movie bookings report retrieved successfully', bookings);
  });

  getBookingsByTheater = asyncHandler(async (req: Request, res: Response) => {
    const bookings = await this.bookingService.getBookingsByTheater();
    ResponseHelper.success(res, 'Theater bookings report retrieved successfully', bookings);
  });

  getUserBookingSummary = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const summary = await this.bookingService.getUserBookingSummary(userId);
    ResponseHelper.success(res, 'User booking summary retrieved successfully', summary);
  });
}