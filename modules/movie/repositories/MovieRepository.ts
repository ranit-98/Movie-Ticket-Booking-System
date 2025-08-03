import { Movie, IMovie } from '../models/Movie';
import { ShowTime } from '../../theater/models/ShowTime';
import { CreateMovieRequest, UpdateMovieRequest, MovieSearchQuery, MovieWithTheaters } from '../types';
import { FilterQuery } from 'mongoose';

export class MovieRepository {
  async create(movieData: CreateMovieRequest, createdBy: string): Promise<IMovie> {
    const movie = new Movie({ ...movieData, createdBy });
    return await movie.save();
  }

  async findById(id: string): Promise<IMovie | null> {
    return await Movie.findById(id).populate('createdBy', 'firstName lastName email');
  }

  async findByIdWithTheaters(id: string): Promise<MovieWithTheaters | null> {
    const movie = await Movie.findById(id) as IMovie | null;
    if (!movie) return null;

    // Find all theaters showing this movie
    const showTimes = await ShowTime.find({
      movieId: id,
      isActive: true,
      showDate: { $gte: new Date() }
    })
    .populate('theaterId')
    .populate('movieId')
    .sort({ showTime: 1 });

    // Group by theater
    const theaterMap = new Map();
    
    for (const showTime of showTimes) {
      const theater = showTime.theaterId as any;
      if (!theater || !theater.isActive) continue;

      const theaterId = theater._id.toString();
      
      if (!theaterMap.has(theaterId)) {
        theaterMap.set(theaterId, {
          _id: theaterId,
          name: theater.name,
          location: theater.location,
          showTimes: []
        });
      }

      theaterMap.get(theaterId).showTimes.push({
        _id: showTime._id,
        screenNumber: showTime.screenNumber,
        showTime: showTime.showTime,
        price: showTime.price,
        availableSeats: showTime.availableSeats,
        totalSeats: showTime.totalSeats
      });
    }

    return {
      _id: (movie as IMovie & { _id: any })._id.toString(),
      name: movie.name,
      description: movie.description,
      genre: movie.genre,
      language: movie.language,
      duration: movie.duration,
      cast: movie.cast,
      director: movie.director,
      releaseDate: movie.releaseDate,
      poster: movie.poster,
      rating: movie.rating,
      isActive: movie.isActive,
      totalTheaters: theaterMap.size,
      theaters: Array.from(theaterMap.values())
    };
  }

  async update(id: string, updateData: UpdateMovieRequest): Promise<IMovie | null> {
    return await Movie.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );
  }

  async delete(id: string): Promise<boolean> {
    const result = await Movie.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );
    return !!result;
  }

  async hardDelete(id: string): Promise<boolean> {
    const result = await Movie.findByIdAndDelete(id);
    return !!result;
  }

  async find(query: MovieSearchQuery = {}, limit?: number, skip?: number): Promise<IMovie[]> {
    const filter: FilterQuery<IMovie> = { isActive: true };

    if (query.name) {
      filter.name = { $regex: query.name, $options: 'i' };
    }

    if (query.genre && query.genre.length > 0) {
      filter.genre = { $in: query.genre };
    }

    if (query.language && query.language.length > 0) {
      filter.language = { $in: query.language };
    }

    if (query.releaseDate) {
      filter.releaseDate = {};
      if (query.releaseDate.from) {
        filter.releaseDate.$gte = query.releaseDate.from;
      }
      if (query.releaseDate.to) {
        filter.releaseDate.$lte = query.releaseDate.to;
      }
    }

    if (query.isActive !== undefined) {
      filter.isActive = query.isActive;
    }

    let queryBuilder = Movie.find(filter).sort({ releaseDate: -1 });

    if (skip) queryBuilder = queryBuilder.skip(skip);
    if (limit) queryBuilder = queryBuilder.limit(limit);

    return await queryBuilder.exec();
  }

  async findWithTheaterCount(): Promise<any[]> {
    return await Movie.aggregate([
      { $match: { isActive: true } },
      {
        $lookup: {
          from: 'showtimes',
          let: { movieId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$movieId', '$movieId'] },
                isActive: true,
                showDate: { $gte: new Date() }
              }
            },
            {
              $group: {
                _id: '$theaterId',
                theaters: { $addToSet: '$theaterId' }
              }
            }
          ],
          as: 'showTimes'
        }
      },
      {
        $addFields: {
          totalTheaters: { $size: '$showTimes' }
        }
      },
      {
        $project: {
          showTimes: 0
        }
      },
      { $sort: { releaseDate: -1 } }
    ]);
  }

  async count(query: MovieSearchQuery = {}): Promise<number> {
    const filter: FilterQuery<IMovie> = { isActive: true };

    if (query.name) {
      filter.name = { $regex: query.name, $options: 'i' };
    }

    if (query.genre && query.genre.length > 0) {
      filter.genre = { $in: query.genre };
    }

    if (query.language && query.language.length > 0) {
      filter.language = { $in: query.language };
    }

    if (query.releaseDate) {
      filter.releaseDate = {};
      if (query.releaseDate.from) {
        filter.releaseDate.$gte = query.releaseDate.from;
      }
      if (query.releaseDate.to) {
        filter.releaseDate.$lte = query.releaseDate.to;
      }
    }

    if (query.isActive !== undefined) {
      filter.isActive = query.isActive;
    }

    return await Movie.countDocuments(filter);
  }

  async exists(query: FilterQuery<IMovie>): Promise<boolean> {
    const result = await Movie.findOne(query);
    return !!result;
  }

  async findByCity(city: string, limit?: number, skip?: number): Promise<IMovie[]> {
    // Find movies playing in theaters in the specified city
    return await Movie.aggregate([
      {
        $lookup: {
          from: 'showtimes',
          let: { movieId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$movieId', '$movieId'] },
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
                'theater.location.city': { $regex: city, $options: 'i' },
                'theater.isActive': true
              }
            }
          ],
          as: 'showTimes'
        }
      },
      {
        $match: {
          isActive: true,
          showTimes: { $ne: [] }
        }
      },
      {
        $project: {
          showTimes: 0
        }
      },
      { $sort: { releaseDate: -1 } },
      ...(skip ? [{ $skip: skip }] : []),
      ...(limit ? [{ $limit: limit }] : [])
    ]);
  }

  async getGenres(): Promise<string[]> {
    const result = await Movie.distinct('genre', { isActive: true });
    return result.sort();
  }

  async getLanguages(): Promise<string[]> {
    const result = await Movie.distinct('language', { isActive: true });
    return result.sort();
  }}