import { BookingStatus } from '../models/Booking';

export interface CreateBookingRequest {
  movieId: string;
  theaterId: string;
  showTimeId: string;
  numberOfTickets: number;
  seatNumbers: number[];
  paymentDetails?: {
    paymentMethod: 'credit_card' | 'debit_card' | 'upi' | 'net_banking' | 'wallet' | 'cash';
    paymentId?: string;
    transactionId?: string;
  };
}

export interface BookingSearchQuery {
  userId?: string;
  movieId?: string;
  theaterId?: string;
  status?: BookingStatus;
  bookingDateFrom?: Date;
  bookingDateTo?: Date;
  showTimeFrom?: Date;
  showTimeTo?: Date;
}

export interface BookingResponse {
  _id: string;
  bookingReference: string;
  userId: string;
  movieId: string;
  theaterId: string;
  showTimeId: string;
  screenNumber: number;
  showTime: Date;
  numberOfTickets: number;
  seatNumbers: number[];
  totalAmount: number;
  bookingDate: Date;
  status: BookingStatus;
  movie: {
    _id: string;
    name: string;
    duration: number;
    genre: string[];
    language: string[];
  };
  theater: {
    _id: string;
    name: string;
    location: {
      address: string;
      city: string;
      state: string;
    };
  };
  paymentDetails?: {
    paymentId?: string;
    paymentMethod?: string;
    transactionId?: string;
  };
}

export interface BookingSummary {
  movieName: string;
  theaterName: string;
  showTime: Date;
  numberOfTickets: number;
  bookingDate: Date;
  status: BookingStatus;
  bookingReference: string;
  totalAmount: number;
}