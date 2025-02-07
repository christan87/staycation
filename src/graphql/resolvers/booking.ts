import { GraphQLError } from 'graphql';
import { IBooking, IBookingModel, BookingModel } from '@/models/Booking';
import mongoose from 'mongoose';
import { getServerSession } from 'next-auth';
import { Session } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { User as UserModel } from '@/models/User';

interface Context {
  session: Session | null;
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

interface PopulatedProperty {
  _id: mongoose.Types.ObjectId;
  title: string;
  images: Array<{ url: string; publicId: string }>;
  location: {
    address: string;
    city: string;
    state: string;
    country: string;
    zipCode: string;
  };
  price: number;
}

interface PopulatedGuest {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  image: string;
}

interface PopulatedBooking extends Omit<IBooking, 'property' | 'guest'> {
  property: PopulatedProperty;
  guest: PopulatedGuest;
}

export const bookingResolvers = {
  Query: {
    booking: async (_: any, { id }: { id: string }, context: Context) => {
      if (!context.session) {
        throw new GraphQLError('Not authenticated');
      }

      const booking = await BookingModel.findById(id)
        .populate('property')
        .populate('guest');

      if (!booking) {
        throw new GraphQLError('Booking not found');
      }

      // Check if user is authorized to view this booking
      const user = await UserModel.findOne({ email: context.session.user?.email });
      if (!user) {
        throw new GraphQLError('User not found');
      }

      const isGuest = booking.guest._id.toString() === user._id.toString();
      const property = await mongoose.model('Property').findById(booking.property);
      if (!property) {
        throw new GraphQLError('Property not found');
      }
      const isHost = property.host.toString() === user._id.toString();

      if (!isGuest && !isHost) {
        throw new GraphQLError('Not authorized to view this booking');
      }

      // Convert to uppercase for GraphQL response
      const formattedBooking = {
        ...booking.toObject(),
        id: (booking._id as mongoose.Types.ObjectId).toString(),
        status: booking.status.toUpperCase(),
        paymentStatus: booking.paymentStatus.toUpperCase()
      };

      return formattedBooking;
    },

    myBookings: async (_: any, __: any, context: Context) => {
      if (!context.session) {
        throw new GraphQLError('User is not authenticated', {
          extensions: { code: 'UNAUTHENTICATED' }
        });
      }

      try {
        const user = await UserModel.findOne({ email: context.session.user?.email });
        if (!user) {
          throw new GraphQLError('User not found');
        }

        const bookings = await BookingModel.find({ guest: user._id })
          .populate({
            path: 'property',
            model: 'Property',
            select: 'id title images location price'
          })
          .populate({
            path: 'guest',
            model: 'User',
            select: 'id name email image'
          })
          .sort({ createdAt: -1 });

        const formattedBookings = bookings.map(booking => {
          const formattedBooking = booking.toObject() as PopulatedBooking;
          
          if (!formattedBooking.property || typeof formattedBooking.property !== 'object') {
            throw new GraphQLError('Property data is missing or invalid');
          }

          // Ensure dates are valid ISO strings
          const checkIn = new Date(formattedBooking.checkIn);
          const checkOut = new Date(formattedBooking.checkOut);
          const createdAt = new Date(formattedBooking.createdAt);
          const updatedAt = new Date(formattedBooking.updatedAt);

          if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime()) || 
              isNaN(createdAt.getTime()) || isNaN(updatedAt.getTime())) {
            throw new GraphQLError('Invalid date values in booking');
          }

          return {
            ...formattedBooking,
            id: formattedBooking._id.toString(),
            property: {
              ...formattedBooking.property,
              id: formattedBooking.property._id.toString()
            },
            guest: {
              ...formattedBooking.guest,
              id: formattedBooking.guest._id.toString()
            },
            status: formattedBooking.status.toUpperCase(),
            paymentStatus: formattedBooking.paymentStatus.toUpperCase(),
            checkIn: checkIn.toISOString(),
            checkOut: checkOut.toISOString(),
            createdAt: createdAt.toISOString(),
            updatedAt: updatedAt.toISOString()
          };
        });
        
        return formattedBookings;
      } catch (error) {
        console.error('Error fetching bookings:', error);
        throw new GraphQLError('Failed to fetch bookings');
      }
    },

    propertyBookings: async (_: any, { propertyId }: { propertyId: string }, context: Context) => {
      const session = await getServerSession(authOptions);
      if (!session?.user?.email) {
        throw new GraphQLError('Not authenticated');
      }

      const user = await UserModel.findOne({ email: session.user.email });
      if (!user) {
        throw new GraphQLError('User not found');
      }

      // Verify user is the property host
      const property = await mongoose.model('Property').findById(propertyId);
      if (!property) {
        throw new GraphQLError('Property not found');
      }

      if (property.host.toString() !== user._id.toString()) {
        throw new GraphQLError('Not authorized to view these bookings');
      }

      return BookingModel.find({ property: propertyId })
        .populate('property')
        .populate('guest')
        .sort({ checkIn: 1 });
    },

    checkAvailability: async (_: any, { propertyId, checkIn, checkOut }: { propertyId: string, checkIn: string, checkOut: string }) => {
      const isAvailable = await BookingModel.checkAvailability(
        new mongoose.Types.ObjectId(propertyId),
        new Date(checkIn),
        new Date(checkOut)
      );
      return isAvailable;
    },
  },

  Mutation: {
    createBooking: async (_: any, { input }: { input: CreateBookingInput }, context: Context) => {
      if (!context.session?.user?.email) {
        throw new GraphQLError('Not authenticated');
      }

      const user = await UserModel.findOne({ email: context.session.user.email });
      if (!user) {
        throw new GraphQLError('User not found');
      }

      try {
        const property = await mongoose.model('Property').findById(input.propertyId);
        if (!property) {
          throw new GraphQLError('Property not found');
        }

        // Check availability
        const isAvailable = await BookingModel.checkAvailability(
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

        const booking = await BookingModel.create({
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

        // Convert to uppercase for GraphQL response
        const formattedBooking = {
          ...booking.toObject(),
          id: (booking._id as mongoose.Types.ObjectId).toString(),
          status: booking.status.toUpperCase(),
          paymentStatus: booking.paymentStatus.toUpperCase()
        };

        return {
          success: true,
          message: 'Booking created successfully',
          booking: formattedBooking
        };
      } catch (error: any) {
        console.error('Error creating booking:', error);
        return {
          success: false,
          message: error.message || 'Failed to create booking',
          booking: null
        };
      }
    },

    updateBooking: async (_: any, { input }: { input: UpdateBookingInput }, context: Context) => {
      const session = await getServerSession(authOptions);
      if (!session?.user?.email) {
        throw new GraphQLError('Not authenticated');
      }

      const user = await UserModel.findOne({ email: session.user.email });
      if (!user) {
        throw new GraphQLError('User not found');
      }

      try {
        const booking = await BookingModel.findById(input.bookingId);
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

          const isAvailable = await BookingModel.checkAvailability(
            propertyId,
            new Date(input.checkIn || booking.checkIn),
            new Date(input.checkOut || booking.checkOut)
          );

          if (!isAvailable) {
            throw new GraphQLError('Property is not available for these dates');
          }
        }

        const updatedBooking = await BookingModel.findByIdAndUpdate(
          input.bookingId,
          {
            ...input,
            checkIn: input.checkIn ? new Date(input.checkIn) : undefined,
            checkOut: input.checkOut ? new Date(input.checkOut) : undefined
          },
          { new: true }
        ).populate(['property', 'guest']);

        if (!updatedBooking) {
          throw new GraphQLError('Booking not found');
        }

        // Convert to uppercase for GraphQL response
        const formattedBooking = {
          ...updatedBooking.toObject(),
          id: (updatedBooking._id as mongoose.Types.ObjectId).toString(),
          status: updatedBooking.status.toUpperCase(),
          paymentStatus: updatedBooking.paymentStatus.toUpperCase()
        };

        return {
          success: true,
          message: 'Booking updated successfully',
          booking: formattedBooking
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

      const user = await UserModel.findOne({ email: session.user.email });
      if (!user) {
        throw new GraphQLError('User not found');
      }

      try {
        const booking = await BookingModel.findById(bookingId);
        if (!booking) {
          throw new GraphQLError('Booking not found');
        }

        // Check authorization (allow both guest and host to cancel)
        const property = await mongoose.model('Property').findById(booking.property);
        if (!property) {
          throw new GraphQLError('Property not found');
        }

        const isGuest = booking.guest.toString() === user._id.toString();
        const isHost = property.host.toString() === user._id.toString();

        if (!isGuest && !isHost) {
          throw new GraphQLError('Not authorized to cancel this booking');
        }

        const updatedBooking = await BookingModel.findByIdAndUpdate(
          bookingId,
          {
            status: 'cancelled',
            paymentStatus: 'refunded'
          },
          { new: true }
        ).populate(['property', 'guest']);

        if (!updatedBooking) {
          throw new GraphQLError('Booking not found');
        }

        // Convert to uppercase for GraphQL response
        const formattedBooking = {
          ...updatedBooking.toObject(),
          id: (updatedBooking._id as mongoose.Types.ObjectId).toString(),
          status: updatedBooking.status.toUpperCase(),
          paymentStatus: updatedBooking.paymentStatus.toUpperCase()
        };

        return {
          success: true,
          message: 'Booking cancelled successfully',
          booking: formattedBooking
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

      const user = await UserModel.findOne({ email: session.user.email });
      if (!user) {
        throw new GraphQLError('User not found');
      }

      try {
        const booking = await BookingModel.findById(bookingId);
        if (!booking) {
          throw new GraphQLError('Booking not found');
        }

        // Only host can confirm booking
        const property = await mongoose.model('Property').findById(booking.property);
        if (!property) {
          throw new GraphQLError('Property not found');
        }

        if (property.host.toString() !== user._id.toString()) {
          throw new GraphQLError('Not authorized to confirm this booking');
        }

        const updatedBooking = await BookingModel.findByIdAndUpdate(
          bookingId,
          {
            status: 'confirmed'
          },
          { new: true }
        ).populate(['property', 'guest']);

        if (!updatedBooking) {
          throw new GraphQLError('Booking not found');
        }

        // Convert to uppercase for GraphQL response
        const formattedBooking = {
          ...updatedBooking.toObject(),
          id: (updatedBooking._id as mongoose.Types.ObjectId).toString(),
          status: updatedBooking.status.toUpperCase(),
          paymentStatus: updatedBooking.paymentStatus.toUpperCase()
        };

        return {
          success: true,
          message: 'Booking confirmed successfully',
          booking: formattedBooking
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

      const user = await UserModel.findOne({ email: session.user.email });
      if (!user) {
        throw new GraphQLError('User not found');
      }

      try {
        const booking = await BookingModel.findById(bookingId);
        if (!booking) {
          throw new GraphQLError('Booking not found');
        }

        // Only host can complete booking
        const property = await mongoose.model('Property').findById(booking.property);
        if (!property) {
          throw new GraphQLError('Property not found');
        }

        if (property.host.toString() !== user._id.toString()) {
          throw new GraphQLError('Not authorized to complete this booking');
        }

        const updatedBooking = await BookingModel.findByIdAndUpdate(
          bookingId,
          {
            status: 'completed'
          },
          { new: true }
        ).populate(['property', 'guest']);

        if (!updatedBooking) {
          throw new GraphQLError('Booking not found');
        }

        // Convert to uppercase for GraphQL response
        const formattedBooking = {
          ...updatedBooking.toObject(),
          id: (updatedBooking._id as mongoose.Types.ObjectId).toString(),
          status: updatedBooking.status.toUpperCase(),
          paymentStatus: updatedBooking.paymentStatus.toUpperCase()
        };

        return {
          success: true,
          message: 'Booking completed successfully',
          booking: formattedBooking
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