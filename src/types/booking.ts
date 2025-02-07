import { Property } from './property';
import { User } from 'next-auth';

export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
export type PaymentStatus = 'PENDING' | 'PAID' | 'REFUNDED';

export interface Booking {
  id: string;
  property: Property;
  guest: User;
  checkIn: string;
  checkOut: string;
  totalPrice: number;
  numberOfGuests: number;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBookingInput {
  propertyId: string;
  checkIn: string;
  checkOut: string;
  numberOfGuests: number;
}

export interface UpdateBookingInput {
  bookingId: string;
  checkIn?: string;
  checkOut?: string;
  numberOfGuests?: number;
  status?: BookingStatus;
  paymentStatus?: PaymentStatus;
}

export interface BookingResponse {
  success: boolean;
  message?: string;
  booking?: Booking;
}

export interface AvailabilityResponse {
  available: boolean;
  message?: string;
}