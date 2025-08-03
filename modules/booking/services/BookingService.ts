import { BookingRepository } from '../repositories/BookingRepository';
import { TheaterRepository } from '../../theater/repositories/TheaterRepository';
import { createError } from '../../../shared/middleware/errorHandler';
import { CreateBookingRequest, BookingSearchQuery, BookingResponse } from '../types';
import { BookingStatus } from '../models/Booking';
import { PaginationQuery } from '../../../shared/types';

export class BookingService {
  private bookingRepository: BookingRepository;
  private theaterRepository: TheaterRepository;

  constructor() {
    this.bookingRepository = new BookingRepository();
    this.theaterRepository = new TheaterRepository();
  }

  async createBooking(bookingData: CreateBookingRequest, userId: string): Promise<BookingResponse> {
    // Get showtime details
    const showTime = await this.theaterRepository.findShowTimeById(bookingData.showTimeId);
    if (!showTime) {
      throw createError('Show time not found', 404);
    }

    // Check if show is still active and in the future
    if (!showTime.isActive || showTime.showTime <= new Date()) {
      throw createError('Show time is not available for booking', 400);
    }

    // Validate seat numbers
    if (bookingData.seatNumbers.length !== bookingData.numberOfTickets) {
      throw createError('Number of seat numbers must match number of tickets', 400);
    }

    // Check if seats are available
    const unavailableSeats = bookingData.seatNumbers.filter(seat => 
      showTime.bookedSeats.includes(seat)
    );

    if (unavailableSeats.length > 0) {
      throw createError(`Seats ${unavailableSeats.join(', ')} are already booked`, 400);
    }

    // Check if enough seats are available
    if (showTime.availableSeats < bookingData.numberOfTickets) {
      throw createError('Not enough seats available', 400);
    }

    // Validate seat numbers are within range
    const invalidSeats = bookingData.seatNumbers.filter(seat => 
      seat < 1 || seat > showTime.totalSeats
    );

    if (invalidSeats.length > 0) {
      throw createError(`Invalid seat numbers: ${invalidSeats.join(', ')}`, 400);
    }

    // Calculate total amount
    const totalAmount = showTime.price * bookingData.numberOfTickets;

    // Create booking with additional details from showtime
    const bookingToCreate = {
      ...bookingData,
      screenNumber: showTime.screenNumber,
      showTime: showTime.showTime,
      totalAmount
    };

    // Create the booking
    const booking = await this.bookingRepository.create(bookingToCreate, userId);

    // Book the seats in showtime
    await this.theaterRepository.bookSeats(bookingData.showTimeId, bookingData.seatNumbers);

    // Return the booking with populated data
    const createdBooking = await this.bookingRepository.findById((booking._id as string).toString());
    if (!createdBooking) {
      throw createError('Failed to retrieve created booking', 500);
    }

    return createdBooking;
  }

  async getBookingById(id: string): Promise<BookingResponse> {
    const booking = await this.bookingRepository.findById(id);
    if (!booking) {
      throw createError('Booking not found', 404);
    }
    return booking;
  }

  async getBookingByReference(reference: string): Promise<BookingResponse> {
    const booking = await this.bookingRepository.findByReference(reference);
    if (!booking) {
      throw createError('Booking not found', 404);
    }
    return booking;
  }

  async cancelBooking(id: string, userId: string): Promise<{ message: string }> {
    const booking = await this.bookingRepository.findById(id);
    if (!booking) {
      throw createError('Booking not found', 404);
    }

    // Check if user owns the booking
    if (booking.userId !== userId) {
      throw createError('You can only cancel your own bookings', 403);
    }

    // Check if booking is already cancelled
    if (booking.status === BookingStatus.CANCELLED) {
      throw createError('Booking is already cancelled', 400);
    }

    // Check if booking can be cancelled (show time should be at least 2 hours away)
    const timeUntilShow = new Date(booking.showTime).getTime() - new Date().getTime();
    const twoHoursInMs = 2 * 60 * 60 * 1000;

    if (timeUntilShow < twoHoursInMs) {
      throw createError('Bookings can only be cancelled at least 2 hours before show time', 400);
    }

    // Update booking status
    await this.bookingRepository.updateStatus(id, BookingStatus.CANCELLED);

    // Release the seats
    await this.theaterRepository.releaseSeats(booking.showTimeId, booking.seatNumbers);

    return { message: 'Booking cancelled successfully' };
  }

  async getUserBookings(
    userId: string,
    pagination: PaginationQuery = {}
  ): Promise<{
    bookings: BookingResponse[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const { page = 1, limit = 10 } = pagination;
    const skip = (page - 1) * limit;

    const [bookings, total] = await Promise.all([
      this.bookingRepository.findUserBookings(userId, limit, skip),
      this.bookingRepository.count({ userId })
    ]);

    return {
      bookings,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async getBookings(
    searchQuery: BookingSearchQuery = {},
    pagination: PaginationQuery = {}
  ): Promise<{
    bookings: BookingResponse[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const { page = 1, limit = 10 } = pagination;
    const skip = (page - 1) * limit;

    const [bookings, total] = await Promise.all([
      this.bookingRepository.find(searchQuery, limit, skip),
      this.bookingRepository.count(searchQuery)
    ]);

    return {
      bookings,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async getBookingsByMovie(): Promise<any[]> {
    return await this.bookingRepository.getBookingsByMovie();
  }

  async getBookingsByTheater(): Promise<any[]> {
    return await this.bookingRepository.getBookingsByTheater();
  }

  async getUserBookingSummary(userId: string): Promise<any[]> {
    return await this.bookingRepository.getUserBookingSummary(userId);
  }
}