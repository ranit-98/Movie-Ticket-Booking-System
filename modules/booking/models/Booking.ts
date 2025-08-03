import mongoose, { Schema, Document } from 'mongoose';

export enum BookingStatus {
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
  PENDING = 'pending'
}

export interface IBooking extends Document {
  userId: mongoose.Types.ObjectId;
  movieId: mongoose.Types.ObjectId;
  theaterId: mongoose.Types.ObjectId;
  showTimeId: mongoose.Types.ObjectId;
  screenNumber: number;
  showTime: Date;
  numberOfTickets: number;
  seatNumbers: number[];
  totalAmount: number;
  bookingDate: Date;
  status: BookingStatus;
  bookingReference: string;
  paymentDetails?: {
    paymentId?: string;
    paymentMethod?: string;
    transactionId?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const bookingSchema = new Schema<IBooking>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
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
  showTimeId: {
    type: Schema.Types.ObjectId,
    ref: 'ShowTime',
    required: [true, 'Show time ID is required']
  },
  screenNumber: {
    type: Number,
    required: [true, 'Screen number is required']
  },
  showTime: {
    type: Date,
    required: [true, 'Show time is required']
  },
  numberOfTickets: {
    type: Number,
    required: [true, 'Number of tickets is required'],
    min: [1, 'Number of tickets must be at least 1'],
    max: [10, 'Cannot book more than 10 tickets at once']
  },
  seatNumbers: [{
    type: Number,
    required: [true, 'Seat numbers are required']
  }],
  totalAmount: {
    type: Number,
    required: [true, 'Total amount is required'],
    min: [0, 'Total amount cannot be negative']
  },
  bookingDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: Object.values(BookingStatus),
    default: BookingStatus.CONFIRMED
  },
  bookingReference: {
    type: String,
    required: [true, 'Booking reference is required'],
    unique: true
  },
  paymentDetails: {
    paymentId: String,
    paymentMethod: {
      type: String,
      enum: ['credit_card', 'debit_card', 'upi', 'net_banking', 'wallet', 'cash']
    },
    transactionId: String
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
bookingSchema.index({ userId: 1 });
bookingSchema.index({ movieId: 1 });
bookingSchema.index({ theaterId: 1 });
bookingSchema.index({ showTimeId: 1 });
bookingSchema.index({ bookingReference: 1 }, { unique: true });
bookingSchema.index({ status: 1 });
bookingSchema.index({ bookingDate: -1 });

// Compound indexes
bookingSchema.index({ userId: 1, status: 1 });
bookingSchema.index({ userId: 1, bookingDate: -1 });
bookingSchema.index({ movieId: 1, status: 1 });
bookingSchema.index({ theaterId: 1, showTime: 1 });
bookingSchema.index({ showTimeId: 1, status: 1 });

// Pre-save middleware to validate seat numbers
bookingSchema.pre('save', function(next) {
  if (this.seatNumbers.length !== this.numberOfTickets) {
    return next(new Error('Number of seat numbers must match number of tickets'));
  }
  
  // Check for duplicate seat numbers
  const uniqueSeats = [...new Set(this.seatNumbers)];
  if (uniqueSeats.length !== this.seatNumbers.length) {
    return next(new Error('Duplicate seat numbers are not allowed'));
  }
  
  next();
});

// Static method to generate booking reference
bookingSchema.statics.generateBookingReference = function(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 5);
  return `BK${timestamp}${random}`.toUpperCase();
};

export const Booking = mongoose.model<IBooking>('Booking', bookingSchema);