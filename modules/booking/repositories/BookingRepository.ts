import { Booking, IBooking, BookingStatus } from '../models/Booking';
import { CreateBookingRequest, BookingSearchQuery, BookingResponse } from '../types';
import { FilterQuery } from 'mongoose';

export class BookingRepository {
  findAllConfirmedFromDate(startDate: Date) {
      throw new Error('Method not implemented.');
  }
  async create(bookingData: CreateBookingRequest, userId: string): Promise<IBooking> {
    const bookingReference = (Booking as any).generateBookingReference();
    
    const booking = new Booking({
      ...bookingData,
      userId,
      bookingReference,
      bookingDate: new Date()
    });

    return await booking.save();
  }

  async findById(id: string): Promise<BookingResponse | null> {
    const booking = await Booking.findById(id)
      .populate('movieId', 'name duration genre language')
      .populate('theaterId', 'name location')
      .populate('userId', 'firstName lastName email')
      .lean();

    if (!booking) return null;

    return {
      _id: booking._id.toString(),
      bookingReference: booking.bookingReference,
      userId: booking.userId && booking.userId._id ? booking.userId._id.toString() : booking.userId.toString(),
      movieId: booking.movieId && booking.movieId._id ? booking.movieId._id.toString() : booking.movieId.toString(),
      theaterId: booking.theaterId && booking.theaterId._id ? booking.theaterId._id.toString() : booking.theaterId.toString(),
      showTimeId: booking.showTimeId.toString(),
      screenNumber: booking.screenNumber,
      showTime: booking.showTime,
      numberOfTickets: booking.numberOfTickets,
      seatNumbers: booking.seatNumbers,
      totalAmount: booking.totalAmount,
      bookingDate: booking.bookingDate,
      status: booking.status,
      movie: booking.movieId as any,
      theater: booking.theaterId as any,
      paymentDetails: booking.paymentDetails
    };
  }

  async findByReference(reference: string): Promise<BookingResponse | null> {
    const booking = await Booking.findOne({ bookingReference: reference })
      .populate('movieId', 'name duration genre language')
      .populate('theaterId', 'name location')
      .populate('userId', 'firstName lastName email')
      .lean();

    if (!booking) return null;

    return {
      _id: booking._id.toString(),
      bookingReference: booking.bookingReference,
      userId: booking.userId && booking.userId._id ? booking.userId._id.toString() : booking.userId.toString(),
      movieId: booking.movieId && booking.movieId._id ? booking.movieId._id.toString() : booking.movieId.toString(),
      theaterId: booking.theaterId && booking.theaterId._id ? booking.theaterId._id.toString() : booking.theaterId.toString(),
      showTimeId: booking.showTimeId.toString(),
      screenNumber: booking.screenNumber,
      showTime: booking.showTime,
      numberOfTickets: booking.numberOfTickets,
      seatNumbers: booking.seatNumbers,
      totalAmount: booking.totalAmount,
      bookingDate: booking.bookingDate,
      status: booking.status,
      movie: booking.movieId as any,
      theater: booking.theaterId as any,
      paymentDetails: booking.paymentDetails
    };
  }

  async updateStatus(id: string, status: BookingStatus): Promise<IBooking | null> {
    return await Booking.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );
  }

  async find(query: BookingSearchQuery = {}, limit?: number, skip?: number): Promise<BookingResponse[]> {
    const filter: FilterQuery<IBooking> = {};

    if (query.userId) {
      filter.userId = query.userId;
    }

    if (query.movieId) {
      filter.movieId = query.movieId;
    }

    if (query.theaterId) {
      filter.theaterId = query.theaterId;
    }

    if (query.status) {
      filter.status = query.status;
    }

    if (query.bookingDateFrom || query.bookingDateTo) {
      filter.bookingDate = {};
      if (query.bookingDateFrom) {
        filter.bookingDate.$gte = query.bookingDateFrom;
      }
      if (query.bookingDateTo) {
        filter.bookingDate.$lte = query.bookingDateTo;
      }
    }

    if (query.showTimeFrom || query.showTimeTo) {
      filter.showTime = {};
      if (query.showTimeFrom) {
        filter.showTime.$gte = query.showTimeFrom;
      }
      if (query.showTimeTo) {
        filter.showTime.$lte = query.showTimeTo;
      }
    }

    let queryBuilder = Booking.find(filter)
      .populate('movieId', 'name duration genre language')
      .populate('theaterId', 'name location')
      .populate('userId', 'firstName lastName email')
      .sort({ bookingDate: -1 })
      .lean();

    if (skip) queryBuilder = queryBuilder.skip(skip);
    if (limit) queryBuilder = queryBuilder.limit(limit);

    const bookings = await queryBuilder.exec();

    return bookings.map(booking => ({
      _id: booking._id.toString(),
      bookingReference: booking.bookingReference,
      userId: (booking.userId && booking.userId._id ? booking.userId._id.toString() : booking.userId.toString()),
      movieId: (booking.movieId && booking.movieId._id ? booking.movieId._id.toString() : booking.movieId.toString()),
      theaterId: (booking.theaterId && booking.theaterId._id ? booking.theaterId._id.toString() : booking.theaterId.toString()),
      showTimeId: booking.showTimeId.toString(),
      screenNumber: booking.screenNumber,
      showTime: booking.showTime,
      numberOfTickets: booking.numberOfTickets,
      seatNumbers: booking.seatNumbers,
      totalAmount: booking.totalAmount,
      bookingDate: booking.bookingDate,
      status: booking.status,
      movie: booking.movieId as any,
      theater: booking.theaterId as any,
      paymentDetails: booking.paymentDetails
    }));
  }

  async count(query: BookingSearchQuery = {}): Promise<number> {
    const filter: FilterQuery<IBooking> = {};

    if (query.userId) {
      filter.userId = query.userId;
    }

    if (query.movieId) {
      filter.movieId = query.movieId;
    }

    if (query.theaterId) {
      filter.theaterId = query.theaterId;
    }

    if (query.status) {
      filter.status = query.status;
    }

    if (query.bookingDateFrom || query.bookingDateTo) {
      filter.bookingDate = {};
      if (query.bookingDateFrom) {
        filter.bookingDate.$gte = query.bookingDateFrom;
      }
      if (query.bookingDateTo) {
        filter.bookingDate.$lte = query.bookingDateTo;
      }
    }

    if (query.showTimeFrom || query.showTimeTo) {
      filter.showTime = {};
      if (query.showTimeFrom) {
        filter.showTime.$gte = query.showTimeFrom;
      }
      if (query.showTimeTo) {
        filter.showTime.$lte = query.showTimeTo;
      }
    }

    return await Booking.countDocuments(filter);
  }

  async findUserBookings(userId: string, limit?: number, skip?: number): Promise<BookingResponse[]> {
    return await this.find({ userId }, limit, skip);
  }

  async getBookingsByMovie(): Promise<any[]> {
    return await Booking.aggregate([
      {
        $match: { status: BookingStatus.CONFIRMED }
      },
      {
        $group: {
          _id: '$movieId',
          totalBookings: { $sum: '$numberOfTickets' },
          totalRevenue: { $sum: '$totalAmount' },
          bookingCount: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'movies',
          localField: '_id',
          foreignField: '_id',
          as: 'movie'
        }
      },
      {
        $unwind: '$movie'
      },
      {
        $project: {
          movieName: '$movie.name',
          genre: '$movie.genre',
          language: '$movie.language',
          totalBookings: 1,
          totalRevenue: 1,
          bookingCount: 1
        }
      },
      {
        $sort: { totalBookings: -1 }
      }
    ]);
  }

  async getBookingsByTheater(): Promise<any[]> {
    return await Booking.aggregate([
      {
        $match: { status: BookingStatus.CONFIRMED }
      },
      {
        $lookup: {
          from: 'movies',
          localField: 'movieId',
          foreignField: '_id',
          as: 'movie'
        }
      },
      {
        $unwind: '$movie'
      },
      {
        $group: {
          _id: {
            theaterId: '$theaterId',
            movieId: '$movieId'
          },
          theaterName: { $first: '$theaterId' },
          movieName: { $first: '$movie.name' },
          totalTickets: { $sum: '$numberOfTickets' },
          totalRevenue: { $sum: '$totalAmount' },
          showTimes: { $addToSet: '$showTime' }
        }
      },
      {
        $lookup: {
          from: 'theaters',
          localField: '_id.theaterId',
          foreignField: '_id',
          as: 'theater'
        }
      },
      {
        $unwind: '$theater'
      },
      {
        $group: {
          _id: '$_id.theaterId',
          theaterName: { $first: '$theater.name' },
          location: { $first: '$theater.location' },
          movies: {
            $push: {
              movieName: '$movieName',
              totalTickets: '$totalTickets',
              totalRevenue: '$totalRevenue',
              showCount: { $size: '$showTimes' }
            }
          },
          totalTheaterBookings: { $sum: '$totalTickets' },
          totalTheaterRevenue: { $sum: '$totalRevenue' }
        }
      },
      {
        $sort: { totalTheaterBookings: -1 }
      }
    ]);
  }

  async getUserBookingSummary(userId: string): Promise<any[]> {
    return await Booking.find({ userId })
      .populate('movieId', 'name')
      .populate('theaterId', 'name')
      .select('bookingReference movieId theaterId showTime numberOfTickets bookingDate status totalAmount')
      .sort({ bookingDate: -1 })
      .lean()
      .then(bookings => 
        bookings.map(booking => ({
          movieName: (booking.movieId as any).name,
          theaterName: (booking.theaterId as any).name,
          showTime: booking.showTime,
          numberOfTickets: booking.numberOfTickets,
          bookingDate: booking.bookingDate,
          status: booking.status,
          bookingReference: booking.bookingReference,
          totalAmount: booking.totalAmount
        }))
      );
  }}