import mongoose, { Schema, Document } from 'mongoose';

export interface IShowTime extends Document {
  movieId: mongoose.Types.ObjectId;
  theaterId: mongoose.Types.ObjectId;
  screenNumber: number;
  showDate: Date;
  showTime: Date;
  price: number;
  totalSeats: number;
  availableSeats: number;
  bookedSeats: number[];
  isActive: boolean;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const showTimeSchema = new Schema<IShowTime>({
  movieId: {
    type: Schema.Types.ObjectId,
    ref: 'Movie',
    required: [true, 'Movie ID is required']
  },
  theaterId: {
    type: Schema.Types.ObjectId,
    ref: 'Theater',
    required: [true, 'Theater ID is required']
  },
  screenNumber: {
    type: Number,
    required: [true, 'Screen number is required'],
    min: [1, 'Screen number must be at least 1']
  },
  showDate: {
    type: Date,
    required: [true, 'Show date is required']
  },
  showTime: {
    type: Date,
    required: [true, 'Show time is required']
  },
  price: {
    type: Number,
    required: [true, 'Ticket price is required'],
    min: [0, 'Price cannot be negative']
  },
  totalSeats: {
    type: Number,
    required: [true, 'Total seats is required'],
    min: [1, 'Total seats must be at least 1']
  },
  availableSeats: {
    type: Number,
    required: [true, 'Available seats is required'],
    min: [0, 'Available seats cannot be negative']
  },
  bookedSeats: [{
    type: Number,
    min: [1, 'Seat number must be at least 1']
  }],
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
showTimeSchema.index({ movieId: 1 });
showTimeSchema.index({ theaterId: 1 });
showTimeSchema.index({ showDate: 1 });
showTimeSchema.index({ showTime: 1 });
showTimeSchema.index({ isActive: 1 });
showTimeSchema.index({ createdBy: 1 });

// Compound indexes
showTimeSchema.index({ movieId: 1, theaterId: 1 });
showTimeSchema.index({ movieId: 1, showDate: 1 });
showTimeSchema.index({ theaterId: 1, showDate: 1 });
showTimeSchema.index({ movieId: 1, theaterId: 1, showDate: 1 });
showTimeSchema.index({ isActive: 1, showDate: 1, showTime: 1 });

// Unique compound index to prevent duplicate shows
showTimeSchema.index(
  { movieId: 1, theaterId: 1, screenNumber: 1, showTime: 1 },
  { unique: true }
);

// Virtual for booked seats count
showTimeSchema.virtual('bookedSeatsCount').get(function() {
  return this.bookedSeats.length;
});

// Pre-save middleware to validate available seats
showTimeSchema.pre('save', function(next) {
  if (this.availableSeats + this.bookedSeats.length !== this.totalSeats) {
    this.availableSeats = this.totalSeats - this.bookedSeats.length;
  }
  next();
});

export const ShowTime = mongoose.model<IShowTime>('ShowTime', showTimeSchema);