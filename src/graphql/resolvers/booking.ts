import { GraphQLError } from 'graphql';
import { IBooking, IBookingModel, Booking } from '@/models/Booking';
import mongoose from 'mongoose';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// Get the models using mongoose.model to avoid circular dependencies
const Property = mongoose.model('Property');
const User = mongoose.model('User');

interface Context {
  session: Awaited<ReturnType<typeof getServerSession>>;
}

interface CreateBookingInput {
  propertyId: string;
  checkIn: string;
  checkOut: string;
  numberOfGuests: number;
}

interface UpdateBookingInput {
  bookingId: string;
  checkIn?: string;
  checkOut?: string;
  numberOfGuests?: number;
  status?: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  paymentStatus?: 'pending' | 'paid' | 'refunded';
}

export const bookingResolvers = {
  Query: {
    booking: async (_: any, { id }: { id: string }, context: Context) => {
      const session = await getServerSession(authOptions);
      if (!session?.user?.email) {
        throw new GraphQLError('Not authenticated');
      }

      const booking = await Booking.findById(id)
        .populate('property')
        .populate('guest');

      if (!booking) {
        throw new GraphQLError('Booking not found');
      }

      // Check if user is authorized to view this booking
      const user = await User.findOne({ email: session.user.email });
      if (!user) {
        throw new GraphQLError('User not found');
      }

      const isGuest = booking.guest._id.toString() === user._id.toString();
      const property = await Property.findById(booking.property);
      if (!property) {
        throw new GraphQLError('Property not found');
      }
      const isHost = property.host.toString() === user._id.toString();

      if (!isGuest && !isHost) {
        throw new GraphQLError('Not authorized to view this booking');
      }

      return booking;
    },

    myBookings: async (_: any, __: any, context: Context) => {
      const session = await getServerSession(authOptions);
      if (!session?.user?.email) {
        throw new GraphQLError('Not authenticated');
      }

      const user = await User.findOne({ email: session.user.email });
      if (!user) {
        throw new GraphQLError('User not found');
      }

      return Booking.find({ guest: user._id })
        .populate('property')
        .populate('guest')
        .sort({ createdAt: -1 });
    },

    propertyBookings: async (_: any, { propertyId }: { propertyId: string }, context: Context) => {
      const session = await getServerSession(authOptions);
      if (!session?.user?.email) {
        throw new GraphQLError('Not authenticated');
      }

      const user = await User.findOne({ email: session.user.email });
      if (!user) {
        throw new GraphQLError('User not found');
      }

      // Verify user is the property host
      const property = await Property.findById(propertyId);
      if (!property) {
        throw new GraphQLError('Property not found');
      }

      if (property.host.toString() !== user._id.toString()) {
        throw new GraphQLError('Not authorized to view these bookings');
      }

      return Booking.find({ property: propertyId })
        .populate('property')
        .populate('guest')
        .sort({ checkIn: 1 });
    },

    checkAvailability: async (_: any, { propertyId, checkIn, checkOut }: { propertyId: string, checkIn: string, checkOut: string }) => {
      const isAvailable = await Booking.checkAvailability(
        new mongoose.Types.ObjectId(propertyId),
        new Date(checkIn),
        new Date(checkOut)
      );
      return isAvailable;
    },
  },

  Mutation: {
    createBooking: async (_: any, { input }: { input: CreateBookingInput }, context: Context) => {
      const session = await getServerSession(authOptions);
      if (!session?.user?.email) {
        throw new GraphQLError('Not authenticated');
      }

      const user = await User.findOne({ email: session.user.email });
      if (!user) {
        throw new GraphQLError('User not found');
      }

      try {
        const property = await Property.findById(input.propertyId);
        if (!property) {
          throw new GraphQLError('Property not found');
        }

        // Check availability
        const isAvailable = await Booking.checkAvailability(
          new mongoose.Types.ObjectId(input.propertyId),
          new Date(input.checkIn),
          new Date(input.checkOut)
        );

        if (!isAvailable) {
          throw new GraphQLError('Property is not available for these dates');
        }

        // Calculate total price
        const checkIn = new Date(input.checkIn);
        const checkOut = new Date(input.checkOut);
        const numberOfNights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
        const totalPrice = property.price * numberOfNights;

        const booking = await Booking.create({
          property: input.propertyId,
          guest: user._id,
          checkIn: new Date(input.checkIn),
          checkOut: new Date(input.checkOut),
          numberOfGuests: input.numberOfGuests,
          totalPrice,
          status: 'pending',
          paymentStatus: 'pending'
        });

        await booking.populate(['property', 'guest']);

        return {
          success: true,
          message: 'Booking created successfully',
          booking
        };
      } catch (error: any) {
        return {
          success: false,
          message: error.message,
          booking: null
        };
      }
    },

    updateBooking: async (_: any, { input }: { input: UpdateBookingInput }, context: Context) => {
      const session = await getServerSession(authOptions);
      if (!session?.user?.email) {
        throw new GraphQLError('Not authenticated');
      }

      const user = await User.findOne({ email: session.user.email });
      if (!user) {
        throw new GraphQLError('User not found');
      }

      try {
        const booking = await Booking.findById(input.bookingId);
        if (!booking) {
          throw new GraphQLError('Booking not found');
        }

        // Check authorization
        if (booking.guest.toString() !== user._id.toString()) {
          throw new GraphQLError('Not authorized to update this booking');
        }

        // If dates are being updated, check availability
        if (input.checkIn || input.checkOut) {
          const propertyId = booking.property instanceof mongoose.Types.ObjectId 
            ? booking.property 
            : new mongoose.Types.ObjectId(booking.property.toString());

          const isAvailable = await Booking.checkAvailability(
            propertyId,
            new Date(input.checkIn || booking.checkIn),
            new Date(input.checkOut || booking.checkOut)
          );

          if (!isAvailable) {
            throw new GraphQLError('Property is not available for these dates');
          }
        }

        const updatedBooking = await Booking.findByIdAndUpdate(
          input.bookingId,
          {
            ...input,
            checkIn: input.checkIn ? new Date(input.checkIn) : undefined,
            checkOut: input.checkOut ? new Date(input.checkOut) : undefined
          },
          { new: true }
        ).populate(['property', 'guest']);

        return {
          success: true,
          message: 'Booking updated successfully',
          booking: updatedBooking
        };
      } catch (error: any) {
        return {
          success: false,
          message: error.message,
          booking: null
        };
      }
    },

    cancelBooking: async (_: any, { bookingId }: { bookingId: string }, context: Context) => {
      const session = await getServerSession(authOptions);
      if (!session?.user?.email) {
        throw new GraphQLError('Not authenticated');
      }

      const user = await User.findOne({ email: session.user.email });
      if (!user) {
        throw new GraphQLError('User not found');
      }

      try {
        const booking = await Booking.findById(bookingId);
        if (!booking) {
          throw new GraphQLError('Booking not found');
        }

        // Check authorization (allow both guest and host to cancel)
        const property = await Property.findById(booking.property);
        if (!property) {
          throw new GraphQLError('Property not found');
        }

        const isGuest = booking.guest.toString() === user._id.toString();
        const isHost = property.host.toString() === user._id.toString();

        if (!isGuest && !isHost) {
          throw new GraphQLError('Not authorized to cancel this booking');
        }

        const updatedBooking = await Booking.findByIdAndUpdate(
          bookingId,
          {
            status: 'cancelled',
            paymentStatus: 'refunded'
          },
          { new: true }
        ).populate(['property', 'guest']);

        return {
          success: true,
          message: 'Booking cancelled successfully',
          booking: updatedBooking
        };
      } catch (error: any) {
        return {
          success: false,
          message: error.message,
          booking: null
        };
      }
    },

    confirmBooking: async (_: any, { bookingId }: { bookingId: string }, context: Context) => {
      const session = await getServerSession(authOptions);
      if (!session?.user?.email) {
        throw new GraphQLError('Not authenticated');
      }

      const user = await User.findOne({ email: session.user.email });
      if (!user) {
        throw new GraphQLError('User not found');
      }

      try {
        const booking = await Booking.findById(bookingId);
        if (!booking) {
          throw new GraphQLError('Booking not found');
        }

        // Only host can confirm booking
        const property = await Property.findById(booking.property);
        if (!property) {
          throw new GraphQLError('Property not found');
        }

        if (property.host.toString() !== user._id.toString()) {
          throw new GraphQLError('Not authorized to confirm this booking');
        }

        const updatedBooking = await Booking.findByIdAndUpdate(
          bookingId,
          {
            status: 'confirmed'
          },
          { new: true }
        ).populate(['property', 'guest']);

        return {
          success: true,
          message: 'Booking confirmed successfully',
          booking: updatedBooking
        };
      } catch (error: any) {
        return {
          success: false,
          message: error.message,
          booking: null
        };
      }
    },

    completeBooking: async (_: any, { bookingId }: { bookingId: string }, context: Context) => {
      const session = await getServerSession(authOptions);
      if (!session?.user?.email) {
        throw new GraphQLError('Not authenticated');
      }

      const user = await User.findOne({ email: session.user.email });
      if (!user) {
        throw new GraphQLError('User not found');
      }

      try {
        const booking = await Booking.findById(bookingId);
        if (!booking) {
          throw new GraphQLError('Booking not found');
        }

        // Only host can complete booking
        const property = await Property.findById(booking.property);
        if (!property) {
          throw new GraphQLError('Property not found');
        }

        if (property.host.toString() !== user._id.toString()) {
          throw new GraphQLError('Not authorized to complete this booking');
        }

        const updatedBooking = await Booking.findByIdAndUpdate(
          bookingId,
          {
            status: 'completed'
          },
          { new: true }
        ).populate(['property', 'guest']);

        return {
          success: true,
          message: 'Booking completed successfully',
          booking: updatedBooking
        };
      } catch (error: any) {
        return {
          success: false,
          message: error.message,
          booking: null
        };
      }
    },
  }
};