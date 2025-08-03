import { Router } from 'express';
import { MovieController } from '../controllers/MovieController';
import { authenticate, authorize } from '../../../shared/middleware/auth';
import { uploadImage } from '../../../shared/utils/fileUpload';
import { UserRole } from '../../../shared/types';
import {
  validateCreateMovie,
  validateUpdateMovie,
  validateMovieSearch
} from '../middleware/validation';

const router = Router();
const movieController = new MovieController();

// Public routes
router.get('/', validateMovieSearch, movieController.getMovies);
router.get('/with-theaters', movieController.getMoviesWithTheaterCount);
router.get('/search', movieController.searchMovies);
router.get('/genres', movieController.getGenres);
router.get('/languages', movieController.getLanguages);
router.get('/city/:city', movieController.getMoviesByCity);
router.get('/:id', movieController.getMovieById);
router.get('/:id/theaters', movieController.getMovieWithTheaters);

// Admin-only routes
router.use(authenticate);
router.use(authorize(UserRole.ADMIN));

router.post('/', validateCreateMovie, movieController.createMovie);
router.put('/:id', validateUpdateMovie, movieController.updateMovie);
router.delete('/:id', movieController.deleteMovie);
router.post('/:id/poster', uploadImage.single('poster'), movieController.uploadMoviePoster);

export default router;