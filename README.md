# Movie Ticket Booking System

A comprehensive movie ticket booking system built with Node.js, Express, TypeScript, and MongoDB.

## Features

### User Features
- ✅ User registration with email verification
- ✅ User login and authentication
- ✅ Profile management with profile picture upload
- ✅ Browse movies and theaters
- ✅ Book movie tickets
- ✅ Cancel bookings
- ✅ View booking history
- ✅ Receive booking summary via email

### Admin Features
- ✅ Movie management (CRUD operations)
- ✅ Theater management (CRUD operations)
- ✅ Show time management
- ✅ Assign movies to theaters
- ✅ View comprehensive reports
- ✅ User management
- ✅ Dashboard with analytics

### Reports & Analytics
- ✅ Movies with total bookings
- ✅ Bookings by theater
- ✅ Revenue reports
- ✅ Popular movies and theaters
- ✅ User analytics

## Tech Stack

- **Backend**: Node.js, Express.js, TypeScript
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Email**: Nodemailer
- **File Upload**: Multer
- **Validation**: Joi
- **Security**: Helmet, CORS, Rate limiting

## Project Structure

```
my-express-app/
├── src/
│   ├── modules/
│   │   ├── auth/                 # Authentication module
│   │   │   ├── controllers/
│   │   │   ├── models/
│   │   │   ├── repositories/
│   │   │   ├── routes/
│   │   │   ├── services/
│   │   │   ├── middleware/
│   │   │   └── types/
│   │   ├── movie/                # Movie management module
│   │   │   ├── controllers/
│   │   │   ├── models/
│   │   │   ├── repositories/
│   │   │   ├── routes/
│   │   │   ├── services/
│   │   │   ├── middleware/
│   │   │   └── types/
│   │   ├── theater/              # Theater management module
│   │   ├── booking/              # Booking management module
│   │   ├── admin/                # Admin module
│   │   └── report/               # Reports module
│   ├── shared/                   # Shared utilities and config
│   │   ├── config/
│   │   ├── middleware/
│   │   ├── utils/
│   │   ├── types/
│   │   └── constants/
│   └── app.ts                    # Main application file
├── public/                       # Static files
├── dist/                         # Compiled TypeScript
├── package.json
├── tsconfig.json
├── .env.example
└── README.md
```

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd my-express-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Update the `.env` file with your configuration:
   ```env
   PORT=3000
   NODE_ENV=development
   MONGODB_URI=mongodb://localhost:27017/movie-booking-system
   JWT_SECRET=your-super-secret-jwt-key-here
   JWT_EXPIRES_IN=7d
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-password
   EMAIL_FROM=noreply@moviebooking.com
   CLIENT_URL=http://localhost:3000
   API_BASE_URL=http://localhost:3000/api
   ```

4. **Start MongoDB**
   Make sure MongoDB is running on your system.

5. **Run the application**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm run build
   npm start
   ```

## API Endpoints

### Authentication Routes (`/api/auth`)
- `POST /signup` - User registration
- `POST /login` - User login
- `POST /verify-email` - Email verification
- `POST /resend-verification` - Resend verification email
- `GET /profile` - Get user profile
- `PUT /profile` - Update user profile
- `POST /profile/picture` - Upload profile picture
- `PUT /change-password` - Change password
- `POST /forgot-password` - Forgot password
- `POST /reset-password` - Reset password
- `POST /refresh-token` - Refresh JWT token
- `POST /logout` - Logout

### Movie Routes (`/api/movies`)
- `GET /` - Get all movies (with filters)
- `GET /with-theaters` - Get movies with theater count
- `GET /search` - Search movies
- `GET /genres` - Get available genres
- `GET /languages` - Get available languages
- `GET /city/:city` - Get movies by city
- `GET /:id` - Get movie by ID
- `GET /:id/theaters` - Get theaters showing a movie
- `POST /` - Create movie (Admin only)
- `PUT /:id` - Update movie (Admin only)
- `DELETE /:id` - Delete movie (Admin only)
- `POST /:id/poster` - Upload movie poster (Admin only)

### Theater Routes (`/api/theaters`)
- `GET /` - Get all theaters
- `GET /:id` - Get theater by ID
- `GET /movie/:movieId` - Get theaters for a movie
- `GET /showtimes/list` - Get show times
- `GET /showtimes/:id` - Get show time by ID
- `POST /` - Create theater (Admin only)
- `PUT /:id` - Update theater (Admin only)
- `DELETE /:id` - Delete theater (Admin only)
- `POST /showtimes` - Create show time (Admin only)
- `PUT /showtimes/:id` - Update show time (Admin only)
- `DELETE /showtimes/:id` - Delete show time (Admin only)
- `POST /assign-movie` - Assign movie to theater (Admin only)

### Booking Routes (`/api/bookings`)
- `POST /` - Create booking
- `GET /my-bookings` - Get user's bookings
- `GET /my-summary` - Get user's booking summary
- `PUT /:id/cancel` - Cancel booking
- `GET /reference/:reference` - Get booking by reference
- `GET /:id` - Get booking by ID
- `GET /` - Get all bookings (Admin only)
- `GET /reports/movies` - Get booking reports by movie (Admin only)
- `GET /reports/theaters` - Get booking reports by theater (Admin only)

### Admin Routes (`/api/admin`)
- `GET /dashboard` - Get dashboard data
- `GET /users` - Get all users
- `GET /users/:id` - Get user by ID
- `PUT /users/:id/status` - Update user status
- `DELETE /users/:id` - Delete user
- `GET /stats/overview` - Get system overview
- `GET /stats/revenue` - Get revenue statistics

### Report Routes (`/api/reports`)
- `POST /booking-summary/email` - Send booking summary email
- `GET /movies` - Get movies with booking statistics (Admin only)
- `GET /theaters` - Get theater booking statistics (Admin only)
- `GET /revenue` - Generate revenue report (Admin only)
- `GET /popular-movies` - Get popular movies (Admin only)
- `GET /popular-theaters` - Get popular theaters (Admin only)
- `GET /user-analytics` - Get user analytics (Admin only)

## Database Schema

### Collections

1. **Users** - User accounts and profiles
2. **Movies** - Movie information
3. **Theaters** - Theater details and screens
4. **ShowTimes** - Movie show timings
5. **Bookings** - Ticket bookings

## Key Features Implemented

### Security
- JWT-based authentication
- Password hashing with bcrypt
- Rate limiting
- Input validation and sanitization
- CORS protection
- Helmet for security headers

### File Management
- Profile picture uploads
- Movie poster uploads
- File type and size validation

### Email Integration
- Email verification on signup
- Booking confirmation emails
- Booking summary emails

### Advanced Features
- Seat management system
- Real-time seat availability
- Booking cancellation with seat release
- Comprehensive reporting system
- Admin dashboard with analytics

## Usage Examples

### Create a new user
```bash
curl