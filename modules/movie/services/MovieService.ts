import { MovieRepository } from '../repositories/MovieRepository';
import { createError } from '../../../shared/middleware/errorHandler';
import { CreateMovieRequest, UpdateMovieRequest, MovieSearchQuery, MovieWithTheaters } from '../types';
import { IMovie } from '../models/Movie';
import { PaginationQuery } from '../../../shared/types';

export class MovieService {
  private movieRepository: MovieRepository;

  constructor() {
    this.movieRepository = new MovieRepository();
  }

  async createMovie(movieData: CreateMovieRequest, createdBy: string): Promise<IMovie> {
    // Check if movie with same name already exists
    const existingMovie = await this.movieRepository.exists({
      name: { $regex: `^${movieData.name}$`, $options: 'i' },
      isActive: true
    });

    if (existingMovie) {
      throw createError('Movie with this name already exists', 400);
    }

    return await this.movieRepository.create(movieData, createdBy);
  }

  async getMovieById(id: string): Promise<IMovie> {
    const movie = await this.movieRepository.findById(id);
    if (!movie) {
      throw createError('Movie not found', 404);
    }
    return movie;
  }

  async getMovieWithTheaters(id: string): Promise<MovieWithTheaters> {
    const movie = await this.movieRepository.findByIdWithTheaters(id);
    if (!movie) {
      throw createError('Movie not found', 404);
    }
    return movie;
  }

  async updateMovie(id: string, updateData: UpdateMovieRequest): Promise<IMovie> {
    // If name is being updated, check for duplicates
    if (updateData.name) {
      const existingMovie = await this.movieRepository.exists({
        name: { $regex: `^${updateData.name}$`, $options: 'i' },
        _id: { $ne: id },
        isActive: true
      });

      if (existingMovie) {
        throw createError('Movie with this name already exists', 400);
      }
    }

    const movie = await this.movieRepository.update(id, updateData);
    if (!movie) {
      throw createError('Movie not found', 404);
    }
    return movie;
  }

  async deleteMovie(id: string): Promise<{ message: string }> {
    const deleted = await this.movieRepository.delete(id);
    if (!deleted) {
      throw createError('Movie not found', 404);
    }
    return { message: 'Movie deleted successfully' };
  }

  async getMovies(
    searchQuery: MovieSearchQuery = {},
    pagination: PaginationQuery = {}
  ): Promise<{
    movies: IMovie[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const { page = 1, limit = 10 } = pagination;
    const skip = (page - 1) * limit;

    const [movies, total] = await Promise.all([
      this.movieRepository.find(searchQuery, limit, skip),
      this.movieRepository.count(searchQuery)
    ]);

    return {
      movies,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async getMoviesWithTheaterCount(
    pagination: PaginationQuery = {}
  ): Promise<{
    movies: any[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const { page = 1, limit = 10 } = pagination;
    const skip = (page - 1) * limit;

    const movies = await this.movieRepository.findWithTheaterCount();
    const total = movies.length;
    const paginatedMovies = movies.slice(skip, skip + limit);

    return {
      movies: paginatedMovies,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async getMoviesByCity(
    city: string,
    pagination: PaginationQuery = {}
  ): Promise<{
    movies: IMovie[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const { page = 1, limit = 10 } = pagination;
    const skip = (page - 1) * limit;

    const movies = await this.movieRepository.findByCity(city, limit, skip);
    
    // For total count, we need to run the same aggregation without pagination
    const allMovies = await this.movieRepository.findByCity(city);
    const total = allMovies.length;

    return {
      movies,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async searchMovies(
    searchTerm: string,
    pagination: PaginationQuery = {}
  ): Promise<{
    movies: IMovie[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const searchQuery: MovieSearchQuery = {
      name: searchTerm
    };

    return await this.getMovies(searchQuery, pagination);
  }

  async getGenres(): Promise<string[]> {
    return await this.movieRepository.getGenres();
  }

  async getLanguages(): Promise<string[]> {
    return await this.movieRepository.getLanguages();
  }

  async updateMoviePoster(id: string, posterUrl: string): Promise<IMovie> {
    const movie = await this.movieRepository.update(id, { poster: posterUrl });
    if (!movie) {
      throw createError('Movie not found', 404);
    }
    return movie;
  }
}