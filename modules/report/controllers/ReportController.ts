import { Request, Response } from "express";
import { ReportService } from "../services/ReportService";
import { asyncHandler } from "../../../shared/middleware/errorHandler";
import { ResponseHelper } from "../../../shared/utils";
import { AuthenticatedRequest } from "../../../shared/types";

export class ReportController {
  private reportService: ReportService;

  constructor() {
    this.reportService = new ReportService();
  }

  getMoviesWithBookings = asyncHandler(async (req: Request, res: Response) => {
    const movies = await this.reportService.getMoviesWithBookings();
    ResponseHelper.success(
      res,
      "Movies with booking statistics retrieved successfully",
      movies
    );
  });

  getBookingsByTheater = asyncHandler(async (req: Request, res: Response) => {
    const theaters = await this.reportService.getBookingsByTheater();
    ResponseHelper.success(
      res,
      "Theater booking statistics retrieved successfully",
      theaters
    );
  });

  sendBookingSummaryEmail = asyncHandler(
    async (req: AuthenticatedRequest, res: Response) => {
      const userId = req.user!.id;
      const result = await this.reportService.sendBookingSummaryEmail(userId);
      ResponseHelper.success(res, result.message);
    }
  );

  generateRevenueReport = asyncHandler(async (req: Request, res: Response) => {
    const { startDate, endDate } = req.query as any;

    if (!startDate || !endDate) {
      return ResponseHelper.error(
        res,
        "Start date and end date are required",
        undefined,
        400
      );
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start >= end) {
      return ResponseHelper.error(
        res,
        "Start date must be before end date",
        undefined,
        400
      );
    }

    const report = await this.reportService.generateRevenueReport(start, end);
    return ResponseHelper.success(
      res,
      "Revenue report generated successfully",
      report
    );
  });

  getPopularMovies = asyncHandler(async (req: Request, res: Response) => {
    const { limit = 10 } = req.query as any;
    const movies = await this.reportService.getPopularMovies(parseInt(limit));
    ResponseHelper.success(
      res,
      "Popular movies retrieved successfully",
      movies
    );
  });

  getPopularTheaters = asyncHandler(async (req: Request, res: Response) => {
    const { limit = 10 } = req.query as any;
    const theaters = await this.reportService.getPopularTheaters(
      parseInt(limit)
    );
    ResponseHelper.success(
      res,
      "Popular theaters retrieved successfully",
      theaters
    );
  });

  getUserAnalytics = asyncHandler(async (req: Request, res: Response) => {
    const analytics = await this.reportService.getUserAnalytics();
    ResponseHelper.success(
      res,
      "User analytics retrieved successfully",
      analytics
    );
  });
}
