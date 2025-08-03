import { Request, Response } from 'express';
import { TheaterService } from '../services/TheaterService';
import { ResponseHelper } from '../../../shared/utils/responseHelper';
import { asyncHandler } from '../../../shared/middleware/errorHandler';
import { AuthenticatedRequest } from '../../../shared/types';

export class TheaterController {
  private theaterService: TheaterService;

  constructor() {
    this.theaterService = new TheaterService();
  }

  // Theater operations
  createTheater = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const createdBy = req.user!.id;
    const theater = await this.theaterService.createTheater(req.body, createdBy);
    ResponseHelper.created(res, 'Theater created successfully', theater);
  });

  getTheaters = asyncHandler(async (req: Request, res: Response) => {
    const { name, city, state, pincode, amenities, page, limit } = req.query as any;
    
    const searchQuery = {
      ...(name && { name }),
      ...(city && { city }),
      ...(state && { state }),
      ...(pincode && { pincode }),
      ...(amenities && { amenities: Array.isArray(amenities) ? amenities : [amenities] })
    };

    const pagination = { page: parseInt(page) || 1, limit: parseInt(limit) || 10 };

    const result = await this.theaterService.getTheaters(searchQuery, pagination);
    ResponseHelper.paginated(res, 'Theaters retrieved successfully', result.theaters, result.pagination);
  });

  getTheaterById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const theater = await this.theaterService.getTheaterById(id);
    ResponseHelper.success(res, 'Theater retrieved successfully', theater);
  });

  updateTheater = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const theater = await this.theaterService.updateTheater(id, req.body);
    ResponseHelper.success(res, 'Theater updated successfully', theater);
  });

  deleteTheater = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const result = await this.theaterService.deleteTheater(id);
    ResponseHelper.success(res, result.message);
  });

  // ShowTime operations
  createShowTime = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const createdBy = req.user!.id;
    const showTime = await this.theaterService.createShowTime(req.body, createdBy);
    ResponseHelper.created(res, 'Show time created successfully', showTime);
  });

  getShowTimes = asyncHandler(async (req: Request, res: Response) => {
    const { movieId, theaterId, screenNumber, showDateFrom, showDateTo, page, limit } = req.query as any;
    
    const searchQuery = {
      ...(movieId && { movieId }),
      ...(theaterId && { theaterId }),
      ...(screenNumber && { screenNumber: parseInt(screenNumber) }),
      ...((showDateFrom || showDateTo) && {
        showDate: {
          ...(showDateFrom && { from: new Date(showDateFrom) }),
          ...(showDateTo && { to: new Date(showDateTo) })
        }
      })
    };

    const pagination = { page: parseInt(page) || 1, limit: parseInt(limit) || 10 };

    const result = await this.theaterService.getShowTimes(searchQuery, pagination);
    ResponseHelper.paginated(res, 'Show times retrieved successfully', result.showTimes, result.pagination);
  });

  getShowTimeById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const showTime = await this.theaterService.getShowTimeById(id);
    ResponseHelper.success(res, 'Show time retrieved successfully', showTime);
  });

  updateShowTime = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const showTime = await this.theaterService.updateShowTime(id, req.body);
    ResponseHelper.success(res, 'Show time updated successfully', showTime);
  });

  deleteShowTime = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const result = await this.theaterService.deleteShowTime(id);
    ResponseHelper.success(res, result.message);
  });

  getTheatersForMovie = asyncHandler(async (req: Request, res: Response) => {
    const { movieId } = req.params;
    const theaters = await this.theaterService.getTheatersForMovie(movieId);
    ResponseHelper.success(res, 'Theaters for movie retrieved successfully', theaters);
  });

  assignMovieToTheater = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { movieId, theaterId, screenNumber, showTimes } = req.body;
    const createdBy = req.user!.id;
    
    const createdShowTimes = await this.theaterService.assignMovieToTheater(
      movieId,
      theaterId,
      screenNumber,
      showTimes,
      createdBy
    );
    
    ResponseHelper.created(res, 'Movie assigned to theater successfully', createdShowTimes);
  });
}