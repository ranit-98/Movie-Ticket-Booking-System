import { createError } from '../../../shared/middleware/errorHandler';
import { UserRepository } from '../../auth/repositories/UserRepository';
import { BookingRepository } from '../../booking/repositories/BookingRepository';
import { emailService } from '../../../shared/utils/emailService';
import { BookingStatus } from '../../booking/models/Booking';

export class ReportService {
  private bookingRepository: BookingRepository;
  private userRepository: UserRepository;

  constructor() {
    this.bookingRepository = new BookingRepository();
    this.userRepository = new UserRepository();
  }

  async getMoviesWithBookings(): Promise<any[]> {
    return await this.bookingRepository.getBookingsByMovie();
  }

  async getBookingsByTheater(): Promise<any[]> {
    return await this.bookingRepository.getBookingsByTheater();
  }

  async sendBookingSummaryEmail(userId: string): Promise<{ message: string }> {
    // Get user details
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw createError('User not found', 404);
    }

    // Get user's booking summary
    const bookingSummary = await this.bookingRepository.getUserBookingSummary(userId);

    if (bookingSummary.length === 0) {
      throw createError('No bookings found for this user', 404);
    }

    // Send email
    const emailSent = await emailService.sendBookingSummaryEmail(user.email, bookingSummary);

    if (!emailSent) {
      throw createError('Failed to send booking summary email', 500);
    }

    return { message: 'Booking summary sent successfully to your email' };
  }

  async generateRevenueReport(startDate: Date, endDate: Date): Promise<any> {
    const bookings = await this.bookingRepository.find({
      bookingDateFrom: startDate,
      bookingDateTo: endDate,
      status: BookingStatus.CONFIRMED
    });

    const totalRevenue = bookings.reduce((sum, booking) => sum + booking.totalAmount, 0);
    const totalBookings = bookings.length;
    const totalTickets = bookings.reduce((sum, booking) => sum + booking.numberOfTickets, 0);

    // Group by movie
    const movieRevenue = bookings.reduce((acc: any, booking) => {
      const movieId = booking.movieId;
      if (!acc[movieId]) {
        acc[movieId] = {
          movieName: booking.movie.name,
          revenue: 0,
          bookings: 0,
          tickets: 0
        };
      }
      acc[movieId].revenue += booking.totalAmount;
      acc[movieId].bookings += 1;
      acc[movieId].tickets += booking.numberOfTickets;
      return acc;
    }, {});

    // Group by theater
    const theaterRevenue = bookings.reduce((acc: any, booking) => {
      const theaterId = booking.theaterId;
      if (!acc[theaterId]) {
        acc[theaterId] = {
          theaterName: booking.theater.name,
          revenue: 0,
          bookings: 0,
          tickets: 0
        };
      }
      acc[theaterId].revenue += booking.totalAmount;
      acc[theaterId].bookings += 1;
      acc[theaterId].tickets += booking.numberOfTickets;
      return acc;
    }, {});

    return {
      summary: {
        totalRevenue,
        totalBookings,
        totalTickets,
        averageBookingValue: totalBookings > 0 ? totalRevenue / totalBookings : 0,
        averageTicketPrice: totalTickets > 0 ? totalRevenue / totalTickets : 0
      },
      movieBreakdown: Object.values(movieRevenue).sort((a: any, b: any) => b.revenue - a.revenue),
      theaterBreakdown: Object.values(theaterRevenue).sort((a: any, b: any) => b.revenue - a.revenue),
      period: {
        startDate,
        endDate
      }
    };
  }

  async getPopularMovies(limit: number = 10): Promise<any[]> {
    const movies = await this.bookingRepository.getBookingsByMovie();
    return movies.slice(0, limit);
  }

  async getPopularTheaters(limit: number = 10): Promise<any[]> {
    const theaters = await this.bookingRepository.getBookingsByTheater();
    return theaters.slice(0, limit);
  }

  async getUserAnalytics(): Promise<any> {
    const [
      totalUsers,
      verifiedUsers,
      usersWithBookings
    ] = await Promise.all([
      this.userRepository.count(),
      this.userRepository.count({ isEmailVerified: true }),
      this.getUniqueUsersWithBookings()
    ]);

    return {
      totalUsers,
      verifiedUsers,
      unverifiedUsers: totalUsers - verifiedUsers,
      usersWithBookings,
      usersWithoutBookings: totalUsers - usersWithBookings,
      conversionRate: totalUsers > 0 ? (usersWithBookings / totalUsers) * 100 : 0
    };
  }

  private async getUniqueUsersWithBookings(): Promise<number> {
    const bookings = await this.bookingRepository.find({ status: BookingStatus.CONFIRMED });
    const uniqueUsers = new Set(bookings.map(booking => booking.userId));
    return uniqueUsers.size;
  }
}