import { TheaterRepository } from '../repositories/TheaterRepository';
import { createError } from '../../../shared/middleware/errorHandler';
import { CreateTheaterRequest, UpdateTheaterRequest, TheaterSearchQuery, CreateShowTimeRequest, UpdateShowTimeRequest, ShowTimeSearchQuery } from '../types';
import { ITheater } from '../models/Theater';
import { IShowTime } from '../models/ShowTime';
import { PaginationQuery } from '../../../shared/types';

export class TheaterService {
  private theaterRepository: TheaterRepository;

  constructor() {
    this.theaterRepository = new TheaterRepository();
  }

  // Theater operations
  async createTheater(theaterData: CreateTheaterRequest, createdBy: string): Promise<ITheater> {
    // Check if theater with same name and location already exists
    const existingTheater = await this.theaterRepository.theaterExists({
      name: { $regex: `^${theaterData.name}$`, $options: 'i' },
      'location.city': { $regex: `^${theaterData.location.city}$`, $options: 'i' },
      'location.address': { $regex: `^${theaterData.location.address}$`, $options: 'i' },
      isActive: true
    });

    if (existingTheater) {
      throw createError('Theater with this name and location already exists', 400);
    }

    // Validate screen numbers are unique
    const screenNumbers = theaterData.screens.map(s => s.screenNumber);
    const uniqueScreenNumbers = [...new Set(screenNumbers)];
    if (screenNumbers.length !== uniqueScreenNumbers.length) {
      throw createError('Screen numbers must be unique', 400);
    }

    return await this.theaterRepository.createTheater(theaterData, createdBy);
  }

  async getTheaterById(id: string): Promise<ITheater> {
    const theater = await this.theaterRepository.findTheaterById(id);
    if (!theater) {
      throw createError('Theater not found', 404);
    }
    return theater;
  }

  async updateTheater(id: string, updateData: UpdateTheaterRequest): Promise<ITheater> {
    // If name or location is being updated, check for duplicates
    if (updateData.name || updateData.location) {
      const existingTheater = await this.theaterRepository.theaterExists({
        name: updateData.name ? { $regex: `^${updateData.name}$`, $options: 'i' } : undefined,
        'location.city': updateData.location?.city ? { $regex: `^${updateData.location.city}$`, $options: 'i' } : undefined,
        'location.address': updateData.location?.address ? { $regex: `^${updateData.location.address}$`, $options: 'i' } : undefined,
        _id: { $ne: id },
        isActive: true
      });

      if (existingTheater) {
        throw createError('Theater with this name and location already exists', 400);
      }
    }

    // Validate screen numbers are unique if screens are being updated
    if (updateData.screens) {
      const screenNumbers = updateData.screens.map(s => s.screenNumber);
      const uniqueScreenNumbers = [...new Set(screenNumbers)];
      if (screenNumbers.length !== uniqueScreenNumbers.length) {
        throw createError('Screen numbers must be unique', 400);
      }
    }

    const theater = await this.theaterRepository.updateTheater(id, updateData);
    if (!theater) {
      throw createError('Theater not found', 404);
    }
    return theater;
  }

  async deleteTheater(id: string): Promise<{ message: string }> {
    const deleted = await this.theaterRepository.deleteTheater(id);
    if (!deleted) {
      throw createError('Theater not found', 404);
    }
    return { message: 'Theater deleted successfully' };
  }

  async getTheaters(
    searchQuery: TheaterSearchQuery = {},
    pagination: PaginationQuery = {}
  ): Promise<{
    theaters: ITheater[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const { page = 1, limit = 10 } = pagination;
    const skip = (page - 1) * limit;

    const [theaters, total] = await Promise.all([
      this.theaterRepository.findTheaters(searchQuery, limit, skip),
      this.theaterRepository.countTheaters(searchQuery)
    ]);

    return {
      theaters,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  // ShowTime operations
  async createShowTime(showTimeData: CreateShowTimeRequest, createdBy: string): Promise<IShowTime> {
    // Check if showtime already exists for the same theater, screen, and time
    const existingShowTime = await this.theaterRepository.showTimeExists({
      theaterId: showTimeData.theaterId,
      screenNumber: showTimeData.screenNumber,
      showTime: showTimeData.showTime,
      isActive: true
    });

    if (existingShowTime) {
      throw createError('Show time already exists for this screen at the same time', 400);
    }

    // Validate show time is in the future
    if (new Date(showTimeData.showTime) <= new Date()) {
      throw createError('Show time must be in the future', 400);
    }

    return await this.theaterRepository.createShowTime(showTimeData, createdBy);
  }

  async getShowTimeById(id: string): Promise<IShowTime> {
    const showTime = await this.theaterRepository.findShowTimeById(id);
    if (!showTime) {
      throw createError('Show time not found', 404);
    }
    return showTime;
  }

  async updateShowTime(id: string, updateData: UpdateShowTimeRequest): Promise<IShowTime> {
    // If show time is being updated, validate it's in the future
    if (updateData.showTime && new Date(updateData.showTime) <= new Date()) {
      throw createError('Show time must be in the future', 400);
    }

    const showTime = await this.theaterRepository.updateShowTime(id, updateData);
    if (!showTime) {
      throw createError('Show time not found', 404);
    }
    return showTime;
  }

  async deleteShowTime(id: string): Promise<{ message: string }> {
    const deleted = await this.theaterRepository.deleteShowTime(id);
    if (!deleted) {
      throw createError('Show time not found', 404);
    }
    return { message: 'Show time deleted successfully' };
  }

  async getShowTimes(
    searchQuery: ShowTimeSearchQuery = {},
    pagination: PaginationQuery = {}
  ): Promise<{
    showTimes: IShowTime[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const { page = 1, limit = 10 } = pagination;
    const skip = (page - 1) * limit;

    const [showTimes, total] = await Promise.all([
      this.theaterRepository.findShowTimes(searchQuery, limit, skip),
      this.theaterRepository.countShowTimes(searchQuery)
    ]);

    return {
      showTimes,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async getTheatersForMovie(movieId: string): Promise<any[]> {
    return await this.theaterRepository.findTheatersForMovie(movieId);
  }

  async assignMovieToTheater(
    movieId: string,
    theaterId: string,
    screenNumber: number,
    showTimes: { showTime: Date; price: number }[],
    createdBy: string
  ): Promise<IShowTime[]> {
    const createdShowTimes: IShowTime[] = [];

    for (const showTimeData of showTimes) {
      const showTime = await this.createShowTime({
        movieId,
        theaterId,
        screenNumber,
        showDate: new Date(showTimeData.showTime.toDateString()),
        showTime: showTimeData.showTime,
        price: showTimeData.price
      }, createdBy);
      
      createdShowTimes.push(showTime);
    }

    return createdShowTimes;
  }
}