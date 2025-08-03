import { UserRepository } from '../../auth/repositories/UserRepository';
import { MovieRepository } from '../../movie/repositories/MovieRepository';
import { TheaterRepository } from '../../theater/repositories/TheaterRepository';
import { BookingRepository } from '../../booking/repositories/BookingRepository';
import { createError } from '../../../shared/middleware/errorHandler';
import { PaginationQuery, UserRole } from '../../../shared/types/index';
import { BookingStatus } from '../../booking/models/Booking';

export class AdminService {
  private userRepository: UserRepository;
  private movieRepository: MovieRepository;
  private theaterRepository: TheaterRepository;
  private bookingRepository: BookingRepository;

  constructor() {
    this.userRepository = new UserRepository();
    this.movieRepository = new MovieRepository();
    this.theaterRepository = new TheaterRepository();
    this.bookingRepository = new BookingRepository();
  }

  async getDashboardData(): Promise<any> {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const [
      totalUsers,
      totalMovies,
      totalTheaters,
      totalBookingsToday,
      totalBookingsMonth,
      revenueToday,
      revenueMonth,
      recentBookings
    ] = await Promise.all([
      this.userRepository.count({ role: UserRole.USER }),
      this.movieRepository.count({ isActive: true }),
      this.theaterRepository.countTheaters({ isActive: true }),
      this.bookingRepository.count({
        status: BookingStatus.CONFIRMED,
        bookingDateFrom: startOfDay
      }),
      this.bookingRepository.count({
        status: BookingStatus.CONFIRMED,
        bookingDateFrom: startOfMonth
      }),
      this.getRevenue(startOfDay),
      this.getRevenue(startOfMonth),
      this.bookingRepository.find({}, 5, 0)
    ]);

    return {
      summary: {
        totalUsers,
        totalMovies,
        totalTheaters,
        bookingsToday: totalBookingsToday,
        bookingsThisMonth: totalBookingsMonth,
        revenueToday,
        revenueThisMonth: revenueMonth
      },
      recentBookings: recentBookings.slice(0, 5)
    };
  }

  async getUsers(
    searchQuery: any = {},
    pagination: PaginationQuery = {}
  ): Promise<{
    users: any[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const { page = 1, limit = 10 } = pagination;
    const skip = (page - 1) * limit;

    const filter: any = {};

    if (searchQuery.search) {
      filter.$or = [
        { firstName: { $regex: searchQuery.search, $options: 'i' } },
        { lastName: { $regex: searchQuery.search, $options: 'i' } },
        { email: { $regex: searchQuery.search, $options: 'i' } }
      ];
    }

    if (searchQuery.role) {
      filter.role = searchQuery.role;
    }

    if (searchQuery.isEmailVerified !== undefined) {
      filter.isEmailVerified = searchQuery.isEmailVerified;
    }

    const [users, total] = await Promise.all([
      this.userRepository.find(filter, limit, skip),
      this.userRepository.count(filter)
    ]);

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async getUserById(id: string): Promise<any> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw createError('User not found', 404);
    }

    // Get user's booking statistics
    const bookingStats = await this.bookingRepository.count({ userId: id });
    const totalSpent = await this.getUserTotalSpent(id);

    return {
      ...user.toJSON(),
      statistics: {
        totalBookings: bookingStats,
        totalSpent
      }
    };
  }

  async updateUserStatus(id: string, statusData: { isEmailVerified?: boolean; isActive?: boolean }): Promise<any> {
    const user = await this.userRepository.update(id, statusData);
    if (!user) {
      throw createError('User not found', 404);
    }
    return user;
  }

  async deleteUser(id: string): Promise<{ message: string }> {
    // Check if user has any bookings
    const hasBookings = await this.bookingRepository.count({ userId: id });
    if (hasBookings > 0) {
      throw createError('Cannot delete user with existing bookings', 400);
    }

    const deleted = await this.userRepository.delete(id);
    if (!deleted) {
      throw createError('User not found', 404);
    }

    return { message: 'User deleted successfully' };
  }

  async getSystemOverview(): Promise<any> {
    const [
      userStats,
      movieStats,
      theaterStats,
      bookingStats
    ] = await Promise.all([
      this.getUserStatistics(),
      this.getMovieStatistics(),
      this.getTheaterStatistics(),
      this.getBookingStatistics()
    ]);

    return {
      users: userStats,
      movies: movieStats,
      theaters: theaterStats,
      bookings: bookingStats
    };
  }

  async getRevenueStats(days: number = 30): Promise<any> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Daily revenue for the period
    const dailyRevenue = await this.bookingRepository.find({
      status: BookingStatus.CONFIRMED,
      bookingDateFrom: startDate,
      bookingDateTo: endDate
    });

    // Group by date
    const revenueByDate = dailyRevenue.reduce((acc: any, booking) => {
      const date = booking.bookingDate.toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = { date, revenue: 0, bookings: 0 };
      }
      acc[date].revenue += booking.totalAmount;
      acc[date].bookings += 1;
      return acc;
    }, {});

    const chartData = Object.values(revenueByDate).sort((a: any, b: any) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const totalRevenue = dailyRevenue.reduce((sum, booking) => sum + booking.totalAmount, 0);
    const totalBookings = dailyRevenue.length;

    return {
      totalRevenue,
      totalBookings,
      averageBookingValue: totalBookings > 0 ? totalRevenue / totalBookings : 0,
      chartData
    };
  }

  private async getRevenue(fromDate: Date): Promise<number> {
    const bookings = await this.bookingRepository.find({
      status: BookingStatus.CONFIRMED,
      bookingDateFrom: fromDate
    });

    return bookings.reduce((sum, booking) => sum + booking.totalAmount, 0);
  }

  private async getUserTotalSpent(userId: string): Promise<number> {
    const bookings = await this.bookingRepository.find({
      userId,
      status: BookingStatus.CONFIRMED
    });

    return bookings.reduce((sum, booking) => sum + booking.totalAmount, 0);
  }

  private async getUserStatistics(): Promise<any> {
    const total = await this.userRepository.count();
    const verified = await this.userRepository.count({ isEmailVerified: true });
    const admins = await this.userRepository.count({ role: UserRole.ADMIN });

    return {
      total,
      verified,
      unverified: total - verified,
      admins,
      users: total - admins
    };
  }

  private async getMovieStatistics(): Promise<any> {
    const total = await this.movieRepository.count();
    const active = await this.movieRepository.count({ isActive: true });

    return {
      total,
      active,
      inactive: total - active
    };
  }

  private async getTheaterStatistics(): Promise<any> {
    const total = await this.theaterRepository.countTheaters();
    const active = await this.theaterRepository.countTheaters({ isActive: true });

    return {
      total,
      active,
      inactive: total - active
    };
  }

  private async getBookingStatistics(): Promise<any> {
    const total = await this.bookingRepository.count();
    const confirmed = await this.bookingRepository.count({ status: BookingStatus.CONFIRMED });
    const cancelled = await this.bookingRepository.count({ status: BookingStatus.CANCELLED });
    const pending = await this.bookingRepository.count({ status: BookingStatus.PENDING });

    return {
      total,
      confirmed,
      cancelled,
      pending
    };
  }
}