import mongoose, { Schema, Document } from 'mongoose';

export interface IMovie extends Document {
  name: string;
  description?: string;
  genre: string[];
  language: string[];
  duration: number; 
  cast: string[];
  director: string;
  releaseDate: Date;
  poster?: string;
  rating?: number;
  isActive: boolean;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const movieSchema = new Schema<IMovie>({
  name: {
    type: String,
    required: [true, 'Movie name is required'],
    trim: true,
    maxlength: [200, 'Movie name cannot exceed 200 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  genre: [{
    type: String,
    required: [true, 'At least one genre is required'],
    enum: [
      'Action', 'Adventure', 'Animation', 'Biography', 'Comedy', 'Crime',
      'Documentary', 'Drama', 'Family', 'Fantasy', 'History', 'Horror',
      'Music', 'Mystery', 'Romance', 'Sci-Fi', 'Sport', 'Thriller', 'War', 'Western','Sci-Fi', 'Thriller'
    ]
  }],
  language: [{
    type: String,
    required: [true, 'At least one language is required'],
    trim: true
  }],
  duration: {
    type: Number,
    required: [true, 'Movie duration is required'],
    min: [1, 'Duration must be at least 1 minute'],
    max: [600, 'Duration cannot exceed 600 minutes']
  },
  cast: [{
    type: String,
    required: [true, 'At least one cast member is required'],
    trim: true
  }],
  director: {
    type: String,
    required: [true, 'Director is required'],
    trim: true,
    maxlength: [100, 'Director name cannot exceed 100 characters']
  },
  releaseDate: {
    type: Date,
    required: [true, 'Release date is required']
  },
  poster: {
    type: String,
    default: null
  },
  rating: {
    type: Number,
    min: [0, 'Rating cannot be less than 0'],
    max: [10, 'Rating cannot be more than 10'],
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      return ret;
    }
  }
});

// Indexes
movieSchema.index({ name: 1 });
movieSchema.index({ genre: 1 });
movieSchema.index({ language: 1 });
movieSchema.index({ releaseDate: -1 });
movieSchema.index({ isActive: 1 });
movieSchema.index({ createdBy: 1 });

// Compound indexes
movieSchema.index({ isActive: 1, releaseDate: -1 });

movieSchema.index({ language: 1 });
movieSchema.index({ genre: 1 });

export const Movie = mongoose.model<IMovie>('Movie', movieSchema);