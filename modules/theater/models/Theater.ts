import mongoose, { Schema, Document } from 'mongoose';

export interface IScreen {
  screenNumber: number;
  totalSeats: number;
  seatLayout?: {
    rows: number;
    seatsPerRow: number;
  };
  isActive: boolean;
}

export interface IShowTime {
  movieId: mongoose.Types.ObjectId;
  screenNumber: number;
  showTime: Date;
  price: number;
  availableSeats: number;
  bookedSeats: number[];
  isActive: boolean;
}

export interface ITheater extends Document {
  name: string;
  location: {
    address: string;
    city: string;
    state: string;
    pincode: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  screens: IScreen[];
  contact: {
    phone?: string;
    email?: string;
  };
  amenities?: string[];
  isActive: boolean;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const screenSchema = new Schema<IScreen>({
  screenNumber: {
    type: Number,
    required: [true, 'Screen number is required'],
    min: [1, 'Screen number must be at least 1']
  },
  totalSeats: {
    type: Number,
    required: [true, 'Total seats is required'],
    min: [1, 'Total seats must be at least 1'],
    max: [500, 'Total seats cannot exceed 500']
  },
  seatLayout: {
    rows: {
      type: Number,
      min: [1, 'Rows must be at least 1']
    },
    seatsPerRow: {
      type: Number,
      min: [1, 'Seats per row must be at least 1']
    }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { _id: false });

const theaterSchema = new Schema<ITheater>({
  name: {
    type: String,
    required: [true, 'Theater name is required'],
    trim: true,
    maxlength: [200, 'Theater name cannot exceed 200 characters']
  },
  location: {
    address: {
      type: String,
      required: [true, 'Address is required'],
      trim: true,
      maxlength: [500, 'Address cannot exceed 500 characters']
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true,
      maxlength: [100, 'City cannot exceed 100 characters']
    },
    state: {
      type: String,
      required: [true, 'State is required'],
      trim: true,
      maxlength: [100, 'State cannot exceed 100 characters']
    },
    pincode: {
      type: String,
      required: [true, 'Pincode is required'],
      trim: true,
      match: [/^\d{6}$/, 'Please provide a valid 6-digit pincode']
    },
    coordinates: {
      latitude: {
        type: Number,
        min: [-90, 'Latitude must be between -90 and 90'],
        max: [90, 'Latitude must be between -90 and 90']
      },
      longitude: {
        type: Number,
        min: [-180, 'Longitude must be between -180 and 180'],
        max: [180, 'Longitude must be between -180 and 180']
      }
    }
  },
  screens: {
    type: [screenSchema],
    required: [true, 'At least one screen is required'],
    validate: {
      validator: function(screens: IScreen[]) {
        return screens && screens.length > 0;
      },
      message: 'Theater must have at least one screen'
    }
  },
  contact: {
    phone: {
      type: String,
      trim: true,
      match: [/^\+?[\d\s-()]+$/, 'Please provide a valid phone number']
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
    }
  },
  amenities: [{
    type: String,
    trim: true,
    enum: [
      'Parking', 'Food Court', 'Wheelchair Accessible', 'Air Conditioning',
      'Dolby Atmos', 'IMAX', '3D', 'Recliner Seats', 'Online Booking', 'WiFi'
    ]
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
theaterSchema.index({ name: 1 });
theaterSchema.index({ 'location.city': 1 });
theaterSchema.index({ 'location.state': 1 });
theaterSchema.index({ 'location.pincode': 1 });
theaterSchema.index({ isActive: 1 });
theaterSchema.index({ createdBy: 1 });

// Compound indexes
theaterSchema.index({ 'location.city': 1, isActive: 1 });
theaterSchema.index({ 'location.coordinates.latitude': 1, 'location.coordinates.longitude': 1 });

// Virtual for screen count
theaterSchema.virtual('totalScreens').get(function() {
  return this.screens.filter(screen => screen.isActive).length;
});

export const Theater = mongoose.model<ITheater>('Theater', theaterSchema);