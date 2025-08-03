export interface CreateTheaterRequest {
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
  screens: {
    screenNumber: number;
    totalSeats: number;
    seatLayout?: {
      rows: number;
      seatsPerRow: number;
    };
  }[];
  contact?: {
    phone?: string;
    email?: string;
  };
  amenities?: string[];
}

export interface UpdateTheaterRequest {
  name?: string;
  location?: {
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
    coordinates?: {
      latitude?: number;
      longitude?: number;
    };
  };
  screens?: {
    screenNumber: number;
    totalSeats: number;
    seatLayout?: {
      rows: number;
      seatsPerRow: number;
    };
    isActive?: boolean;
  }[];
  contact?: {
    phone?: string;
    email?: string;
  };
  amenities?: string[];
  isActive?: boolean;
}

export interface CreateShowTimeRequest {
  movieId: string;
  theaterId: string;
  screenNumber: number;
  showDate: Date;
  showTime: Date;
  price: number;
}

export interface UpdateShowTimeRequest {
  showDate?: Date;
  showTime?: Date;
  price?: number;
  isActive?: boolean;
}

export interface TheaterSearchQuery {
  name?: string;
  city?: string;
  state?: string;
  pincode?: string;
  amenities?: string[];
  isActive?: boolean;
}

export interface ShowTimeSearchQuery {
  movieId?: string;
  theaterId?: string;
  screenNumber?: number;
  showDate?: {
    from?: Date;
    to?: Date;
  };
  isActive?: boolean;
}