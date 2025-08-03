import { Theater, ITheater } from '../models/Theater';
import { ShowTime, IShowTime } from '../models/ShowTime';
import { CreateTheaterRequest, UpdateTheaterRequest, TheaterSearchQuery, CreateShowTimeRequest, UpdateShowTimeRequest, ShowTimeSearchQuery } from '../types';
import { FilterQuery } from 'mongoose';

export class TheaterRepository {
  // Theater CRUD operations
  async createTheater(theaterData: CreateTheaterRequest, createdBy: string): Promise<ITheater> {
    const theater = new Theater({ ...theaterData, createdBy });
    return await theater.save();
  }

  async findTheaterById(id: string): Promise<ITheater | null> {
    return await Theater.findById(id).populate('createdBy', 'firstName lastName email');
  }

  async updateTheater(id: string, updateData: UpdateTheaterRequest): Promise<ITheater | null> {
    return await Theater.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );
  }

  async deleteTheater(id: string): Promise<boolean> {
    const result = await Theater.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );
    return !!result;
  }

  async findTheaters(query: TheaterSearchQuery = {}, limit?: number, skip?: number): Promise<ITheater[]> {
    const filter: FilterQuery<ITheater> = { isActive: true };

    if (query.name) {
      filter.name = { $regex: query.name, $options: 'i' };
    }

    if (query.city) {
      filter['location.city'] = { $regex: query.city, $options: 'i' };
    }

    if (query.state) {
      filter['location.state'] = { $regex: query.state, $options: 'i' };
    }

    if (query.pincode) {
      filter['location.pincode'] = query.pincode;
    }

    if (query.amenities && query.amenities.length > 0) {
      filter.amenities = { $in: query.amenities };
    }

    if (query.isActive !== undefined) {
      filter.isActive = query.isActive;
    }

    let queryBuilder = Theater.find(filter).sort({ name: 1 });

    if (skip) queryBuilder = queryBuilder.skip(skip);
    if (limit) queryBuilder = queryBuilder.limit(limit);

    return await queryBuilder.exec();
  }

  async countTheaters(query: TheaterSearchQuery = {}): Promise<number> {
    const filter: FilterQuery<ITheater> = { isActive: true };

    if (query.name) {
      filter.name = { $regex: query.name, $options: 'i' };
    }

    if (query.city) {
      filter['location.city'] = { $regex: query.city, $options: 'i' };
    }

    if (query.state) {
      filter['location.state'] = { $regex: query.state, $options: 'i' };
    }

    if (query.pincode) {
      filter['location.pincode'] = query.pincode;
    }

    if (query.amenities && query.amenities.length > 0) {
      filter.amenities = { $in: query.amenities };
    }

    if (query.isActive !== undefined) {
      filter.isActive = query.isActive;
    }

    return await Theater.countDocuments(filter);
  }

  async theaterExists(query: FilterQuery<ITheater>): Promise<boolean> {
    const result = await Theater.findOne(query);
    return !!result;
  }

  // ShowTime CRUD operations
  async createShowTime(showTimeData: CreateShowTimeRequest, createdBy: string): Promise<IShowTime> {
    // Get theater and screen info to set total seats
    const theater = await this.findTheaterById(showTimeData.theaterId);
    if (!theater) {
      throw new Error('Theater not found');
    }

    const screen = theater.screens.find(s => s.screenNumber === showTimeData.screenNumber && s.isActive);
    if (!screen) {
      throw new Error('Screen not found or inactive');
    }

    const showTime = new ShowTime({
      ...showTimeData,
      totalSeats: screen.totalSeats,
      availableSeats: screen.totalSeats,
      bookedSeats: [],
      createdBy
    });

    return await showTime.save();
  }

  async findShowTimeById(id: string): Promise<IShowTime | null> {
    return await ShowTime.findById(id)
      .populate('movieId')
      .populate('theaterId')
      .populate('createdBy', 'firstName lastName email');
  }

  async updateShowTime(id: string, updateData: UpdateShowTimeRequest): Promise<IShowTime | null> {
    return await ShowTime.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );
  }

  async deleteShowTime(id: string): Promise<boolean> {
    const result = await ShowTime.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );
    return !!result;
  }

  async findShowTimes(query: ShowTimeSearchQuery = {}, limit?: number, skip?: number): Promise<IShowTime[]> {
    const filter: FilterQuery<IShowTime> = { isActive: true };

    if (query.movieId) {
      filter.movieId = query.movieId;
    }

    if (query.theaterId) {
      filter.theaterId = query.theaterId;
    }

    if (query.screenNumber) {
      filter.screenNumber = query.screenNumber;
    }

    if (query.showDate) {
      filter.showDate = {};
      if (query.showDate.from) {
        filter.showDate.$gte = query.showDate.from;
      }
      if (query.showDate.to) {
        filter.showDate.$lte = query.showDate.to;
      }
    }

    if (query.isActive !== undefined) {
      filter.isActive = query.isActive;
    }

    let queryBuilder = ShowTime.find(filter)
      .populate('movieId')
      .populate('theaterId')
      .sort({ showTime: 1 });

    if (skip) queryBuilder = queryBuilder.skip(skip);
    if (limit) queryBuilder = queryBuilder.limit(limit);

    return await queryBuilder.exec();
  }

  async countShowTimes(query: ShowTimeSearchQuery = {}): Promise<number> {
    const filter: FilterQuery<IShowTime> = { isActive: true };

    if (query.movieId) {
      filter.movieId = query.movieId;
    }

    if (query.theaterId) {
      filter.theaterId = query.theaterId;
    }

    if (query.screenNumber) {
      filter.screenNumber = query.screenNumber;
    }

    if (query.showDate) {
      filter.showDate = {};
      if (query.showDate.from) {
        filter.showDate.$gte = query.showDate.from;
      }
      if (query.showDate.to) {
        filter.showDate.$lte = query.showDate.to;
      }
    }

    if (query.isActive !== undefined) {
      filter.isActive = query.isActive;
    }

    return await ShowTime.countDocuments(filter);
  }

  async showTimeExists(query: FilterQuery<IShowTime>): Promise<boolean> {
    const result = await ShowTime.findOne(query);
    return !!result;
  }

  async findTheatersForMovie(movieId: string): Promise<any[]> {
    return await ShowTime.aggregate([
      {
        $match: {
          movieId: movieId,
          isActive: true,
          showDate: { $gte: new Date() }
        }
      },
      {
        $lookup: {
          from: 'theaters',
          localField: 'theaterId',
          foreignField: '_id',
          as: 'theater'
        }
      },
      {
        $unwind: '$theater'
      },
      {
        $match: {
          'theater.isActive': true
        }
      },
      {
        $group: {
          _id: '$theaterId',
          theater: { $first: '$theater' },
          showTimes: {
            $push: {
              _id: '$_id',
              screenNumber: '$screenNumber',
              showTime: '$showTime',
              price: '$price',
              availableSeats: '$availableSeats',
              totalSeats: '$totalSeats'
            }
          }
        }
      },
      {
        $project: {
          _id: '$theater._id',
          name: '$theater.name',
          location: '$theater.location',
          contact: '$theater.contact',
          amenities: '$theater.amenities',
          showTimes: 1
        }
      },
      {
        $sort: { name: 1 }
      }
    ]);
  }

  async bookSeats(showTimeId: string, seatNumbers: number[]): Promise<IShowTime | null> {
    return await ShowTime.findByIdAndUpdate(
      showTimeId,
      {
        $addToSet: { bookedSeats: { $each: seatNumbers } },
        $inc: { availableSeats: -seatNumbers.length }
      },
      { new: true }
    );
  }

  async releaseSeats(showTimeId: string, seatNumbers: number[]): Promise<IShowTime | null> {
    return await ShowTime.findByIdAndUpdate(
      showTimeId,
      {
        $pullAll: { bookedSeats: seatNumbers },
        $inc: { availableSeats: seatNumbers.length }
      },
      { new: true }
    );
  }
}