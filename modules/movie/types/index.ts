export interface CreateMovieRequest {
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
}

export interface UpdateMovieRequest {
  name?: string;
  description?: string;
  genre?: string[];
  language?: string[];
  duration?: number;
  cast?: string[];
  director?: string;
  releaseDate?: Date;
  poster?: string;
  rating?: number;
  isActive?: boolean;
}

export interface MovieSearchQuery {
  name?: string;
  genre?: string[];
  language?: string[];
  city?: string;
  releaseDate?: {
    from?: Date;
    to?: Date;
  };
  isActive?: boolean;
}

export interface MovieWithTheaters {
  _id: string;
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
  totalTheaters: number;
  theaters: TheaterWithShows[];
}

export interface TheaterWithShows {
  _id: string;
  name: string;
  location: {
    address: string;
    city: string;
    state: string;
    pincode: string;
  };
  showTimes: ShowTimeInfo[];
}

export interface ShowTimeInfo {
  _id: string;
  screenNumber: number;
  showTime: Date;
  price: number;
  availableSeats: number;
  totalSeats: number;
}