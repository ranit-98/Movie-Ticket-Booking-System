import { Request, Response } from 'express';
import { MovieService } from '../services/MovieService';
import { ResponseHelper } from '../../../shared/utils/responseHelper';
import { asyncHandler } from '../../../shared/middleware/errorHandler';
import { AuthenticatedRequest } from '../../../shared/types';
import { getFileUrl } from '../../../shared/utils/fileUpload';

export class MovieController {
  private movieService: MovieService;

  constructor() {
    this.movieService = new MovieService();
  }

  createMovie = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const createdBy = req.user!.id;
    const movie = await this.movieService.createMovie(req.body, createdBy);
    ResponseHelper.created(res, 'Movie created successfully', movie);
  });

  getMovies = asyncHandler(async (req: Request, res: Response) => {
    const { name, genre, language, city, releaseDateFrom, releaseDateTo, page, limit } = req.query as any;
    
    const searchQuery = {
      ...(name && { name }),
      ...(genre && { genre: Array.isArray(genre) ? genre : [genre] }),
      ...(language && { language: Array.isArray(language) ? language : [language] }),
      ...(city && { city }),
      ...((releaseDateFrom || releaseDateTo) && {
        releaseDate: {
          ...(releaseDateFrom && { from: new Date(releaseDateFrom) }),
          ...(releaseDateTo && { to: new Date(releaseDateTo) })
        }
      })
    };

    const pagination = { page: parseInt(page) || 1, limit: parseInt(limit) || 10 };

    const result = await this.movieService.getMovies(searchQuery, pagination);
    ResponseHelper.paginated(res, 'Movies retrieved successfully', result.movies, result.pagination);
  });

  getMoviesWithTheaterCount = asyncHandler(async (req: Request, res: Response) => {
    const { page, limit } = req.query as any;
    const pagination = { page: parseInt(page) || 1, limit: parseInt(limit) || 10 };

    const result = await this.movieService.getMoviesWithTheaterCount(pagination);
    ResponseHelper.paginated(res, 'Movies with theater count retrieved successfully', result.movies, result.pagination);
  });

  getMovieById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const movie = await this.movieService.getMovieById(id);
    ResponseHelper.success(res, 'Movie retrieved successfully', movie);
  });

  getMovieWithTheaters = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const movie = await this.movieService.getMovieWithTheaters(id);
    ResponseHelper.success(res, 'Movie with theaters retrieved successfully', movie);
  });

  updateMovie = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const movie = await this.movieService.updateMovie(id, req.body);
    ResponseHelper.success(res, 'Movie updated successfully', movie);
  });

  deleteMovie = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const result = await this.movieService.deleteMovie(id);
    ResponseHelper.success(res, result.message);
  });

  getMoviesByCity = asyncHandler(async (req: Request, res: Response) => {
    const { city } = req.params;
    const { page, limit } = req.query as any;
    const pagination = { page: parseInt(page) || 1, limit: parseInt(limit) || 10 };

    const result = await this.movieService.getMoviesByCity(city, pagination);
    ResponseHelper.paginated(res, `Movies in ${city} retrieved successfully`, result.movies, result.pagination);
  });

  searchMovies = asyncHandler(async (req: Request, res: Response) => {
    const { q: searchTerm, page, limit } = req.query as any;
    
    if (!searchTerm) {
      return ResponseHelper.error(res, 'Search term is required', undefined, 400);
    }

    const pagination = { page: parseInt(page) || 1, limit: parseInt(limit) || 10 };
    const result = await this.movieService.searchMovies(searchTerm, pagination);
    
   return  ResponseHelper.paginated(res, 'Movies search results', result.movies, result.pagination);
  });

  getGenres = asyncHandler(async (req: Request, res: Response) => {
    const genres = await this.movieService.getGenres();
    ResponseHelper.success(res, 'Genres retrieved successfully', genres);
  });

  getLanguages = asyncHandler(async (req: Request, res: Response) => {
    const languages = await this.movieService.getLanguages();
    ResponseHelper.success(res, 'Languages retrieved successfully', languages);
  });

  uploadMoviePoster = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    
    if (!req.file) {
      return ResponseHelper.error(res, 'No poster image uploaded', undefined, 400);
    }

    const posterUrl = getFileUrl(req.file.filename, 'movies');
    const movie = await this.movieService.updateMoviePoster(id, posterUrl);
    
     return ResponseHelper.success(res, 'Movie poster updated successfully', movie);
  });
}