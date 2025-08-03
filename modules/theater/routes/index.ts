import { Router } from 'express';
import { TheaterController } from '../controllers/TheaterController';
import { authenticate, authorize } from '../../../shared/middleware/auth';
import { UserRole } from '../../../shared/types';

const router = Router();
const theaterController = new TheaterController();

// Public routes
router.get('/', theaterController.getTheaters);
router.get('/:id', theaterController.getTheaterById);
router.get('/movie/:movieId', theaterController.getTheatersForMovie);

// Show time public routes
router.get('/showtimes/list', theaterController.getShowTimes);
router.get('/showtimes/:id', theaterController.getShowTimeById);

// Admin-only routes
router.use(authenticate);
router.use(authorize(UserRole.ADMIN));

// Theater management
router.post('/', theaterController.createTheater);
router.put('/:id', theaterController.updateTheater);
router.delete('/:id', theaterController.deleteTheater);

// Show time management
router.post('/showtimes', theaterController.createShowTime);
router.put('/showtimes/:id', theaterController.updateShowTime);
router.delete('/showtimes/:id', theaterController.deleteShowTime);

// Movie assignment
router.post('/assign-movie', theaterController.assignMovieToTheater);

export default router;