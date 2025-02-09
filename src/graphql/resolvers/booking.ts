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
  maxGuests: number;
  host: mongoose.Types.ObjectId;
  toObject: () => any;
}

interface PopulatedGuest {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  image: string;
  toObject: () => any;
}

interface PopulatedBooking extends Omit<IBooking, 'property' | 'guest'> {
  property: PopulatedProperty;
  guest: PopulatedGuest;
  toObject: () => any;
}

export const bookingResolvers = {
  Query: {
    booking: async (_: any, { id }: { id: string }, context: Context) => {
      if (!context.session) {
        throw new GraphQLError('Not authenticated');
      }

      const booking = await BookingModel.findById(id)
        .populate<{ property: PopulatedProperty }>({
          path: 'property',
          select: 'id title images location price maxGuests host'
        })
        .populate<{ guest: PopulatedGuest }>('guest')
        .exec();

      if (!booking) {
        throw new GraphQLError('Booking not found');
      }

      // Check if property and guest are populated
      if (!booking.property || !booking.guest || 
          booking.property instanceof mongoose.Types.ObjectId || 
          booking.guest instanceof mongoose.Types.ObjectId) {
        throw new GraphQLError('Failed to load booking details');
      }

      // Check if user is authorized to view this booking
      const user = await UserModel.findOne({ email: context.session.user?.email });
      if (!user) {
        throw new GraphQLError('User not found');
      }

      const isGuest = booking.guest._id.toString() === user._id.toString();
      const isHost = booking.property.host?.toString() === user._id.toString();

      if (!isGuest && !isHost) {
        throw new GraphQLError('Not authorized to view this booking');
      }

      // Transform the MongoDB document to match GraphQL schema
      const bookingObj = booking.toObject();
      const formattedBooking = {
        ...bookingObj,
        id: booking._id.toString(),
        property: {
          ...bookingObj.property,
          id: booking.property._id.toString(),
        },
        guest: {
          ...bookingObj.guest,
          id: booking.guest._id.toString(),
        },
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
          .populate<{ property: PopulatedProperty }>({
            path: 'property',
            model: 'Property',
            select: 'id title images location price maxGuests host'
          })
          .populate<{ guest: PopulatedGuest }>({
            path: 'guest',
            model: 'User',
            select: 'id name email image'
          })
          .sort({ createdAt: -1 });

        const formattedBookings = bookings.map(booking => {
          const bookingObj = booking.toObject() as PopulatedBooking;
          
          if (!bookingObj.property || !bookingObj.guest || 
              bookingObj.property instanceof mongoose.Types.ObjectId || 
              bookingObj.guest instanceof mongoose.Types.ObjectId) {
            throw new GraphQLError('Failed to load booking details');
          }

          // Ensure dates are valid ISO strings
          const checkIn = new Date(bookingObj.checkIn);
          const checkOut = new Date(bookingObj.checkOut);
          const createdAt = new Date(bookingObj.createdAt);
          const updatedAt = new Date(bookingObj.updatedAt);

          if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime()) || 
              isNaN(createdAt.getTime()) || isNaN(updatedAt.getTime())) {
            throw new GraphQLError('Invalid date values in booking');
          }

          return {
            ...bookingObj,
            id: bookingObj._id.toString(),
            property: {
              ...bookingObj.property,
              id: bookingObj.property._id.toString()
            },
            guest: {
              ...bookingObj.guest,
              id: bookingObj.guest._id.toString()
            },
            status: bookingObj.status.toUpperCase(),
            paymentStatus: bookingObj.paymentStatus.toUpperCase(),
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
        .populate<{ property: PopulatedProperty }>('property')
        .populate<{ guest: PopulatedGuest }>('guest')
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
          return {
            success: false,
            message: 'Property is not available for these dates',
            booking: null
          };
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

        // Populate and transform the booking
        const populatedBooking = await BookingModel.findById(booking._id)
          .populate<{ property: PopulatedProperty }>({
            path: 'property',
            select: 'id title images location price maxGuests host'
          })
          .populate<{ guest: PopulatedGuest }>({
            path: 'guest',
            select: 'id name email image'
          });

        if (!populatedBooking || !populatedBooking.property || !populatedBooking.guest) {
          throw new GraphQLError('Failed to create booking');
        }

        const bookingObj = populatedBooking.toObject();
        const formattedBooking = {
          ...bookingObj,
          id: bookingObj._id.toString(),
          property: {
            ...bookingObj.property,
            id: bookingObj.property._id.toString(),
          },
          guest: {
            ...bookingObj.guest,
            id: bookingObj.guest._id.toString(),
          },
          checkIn: bookingObj.checkIn.toISOString(),
          checkOut: bookingObj.checkOut.toISOString(),
          totalPrice: bookingObj.totalPrice,
          numberOfGuests: bookingObj.numberOfGuests,
          status: bookingObj.status.toUpperCase(),
          paymentStatus: bookingObj.paymentStatus.toUpperCase(),
          createdAt: bookingObj.createdAt.toISOString(),
          updatedAt: bookingObj.updatedAt.toISOString()
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
          { $set: input },
          { new: true }
        )
        .populate<{ property: PopulatedProperty }>('property')
        .populate<{ guest: PopulatedGuest }>('guest')
        .exec();

        if (!updatedBooking) {
          throw new GraphQLError('Booking not found');
        }

        // Check if property and guest are populated
        if (!updatedBooking.property || !updatedBooking.guest || 
            updatedBooking.property instanceof mongoose.Types.ObjectId || 
            updatedBooking.guest instanceof mongoose.Types.ObjectId) {
          throw new GraphQLError('Failed to load booking details');
        }

        const bookingObj = updatedBooking.toObject();
        const formattedBooking = {
          ...bookingObj,
          id: updatedBooking._id.toString(),
          property: {
            ...bookingObj.property,
            id: updatedBooking.property._id.toString(),
          },
          guest: {
            ...bookingObj.guest,
            id: updatedBooking.guest._id.toString(),
          },
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
        )
        .populate<{ property: PopulatedProperty }>('property')
        .populate<{ guest: PopulatedGuest }>('guest')
        .exec();

        if (!updatedBooking) {
          throw new GraphQLError('Booking not found');
        }

        // Check if property and guest are populated
        if (!updatedBooking.property || !updatedBooking.guest || 
            updatedBooking.property instanceof mongoose.Types.ObjectId || 
            updatedBooking.guest instanceof mongoose.Types.ObjectId) {
          throw new GraphQLError('Failed to load booking details');
        }

        const bookingObj = updatedBooking.toObject();
        const formattedBooking = {
          ...bookingObj,
          id: updatedBooking._id.toString(),
          property: {
            ...bookingObj.property,
            id: updatedBooking.property._id.toString(),
          },
          guest: {
            ...bookingObj.guest,
            id: updatedBooking.guest._id.toString(),
          },
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
        )
        .populate<{ property: PopulatedProperty }>('property')
        .populate<{ guest: PopulatedGuest }>('guest')
        .exec();

        if (!updatedBooking) {
          throw new GraphQLError('Booking not found');
        }

        // Check if property and guest are populated
        if (!updatedBooking.property || !updatedBooking.guest || 
            updatedBooking.property instanceof mongoose.Types.ObjectId || 
            updatedBooking.guest instanceof mongoose.Types.ObjectId) {
          throw new GraphQLError('Failed to load booking details');
        }

        const bookingObj = updatedBooking.toObject();
        const formattedBooking = {
          ...bookingObj,
          id: updatedBooking._id.toString(),
          property: {
            ...bookingObj.property,
            id: updatedBooking.property._id.toString(),
          },
          guest: {
            ...bookingObj.guest,
            id: updatedBooking.guest._id.toString(),
          },
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
        )
        .populate<{ property: PopulatedProperty }>('property')
        .populate<{ guest: PopulatedGuest }>('guest')
        .exec();

        if (!updatedBooking) {
          throw new GraphQLError('Booking not found');
        }

        // Check if property and guest are populated
        if (!updatedBooking.property || !updatedBooking.guest || 
            updatedBooking.property instanceof mongoose.Types.ObjectId || 
            updatedBooking.guest instanceof mongoose.Types.ObjectId) {
          throw new GraphQLError('Failed to load booking details');
        }

        const bookingObj = updatedBooking.toObject();
        const formattedBooking = {
          ...bookingObj,
          id: updatedBooking._id.toString(),
          property: {
            ...bookingObj.property,
            id: updatedBooking.property._id.toString(),
          },
          guest: {
            ...bookingObj.guest,
            id: updatedBooking.guest._id.toString(),
          },
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

    deleteBooking: async (_: any, { bookingId }: { bookingId: string }, context: Context) => {
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

        // Check authorization
        if (booking.guest.toString() !== user._id.toString()) {
          throw new GraphQLError('Not authorized to delete this booking');
        }

        // Only allow deletion of cancelled bookings
        if (booking.status.toLowerCase() !== 'cancelled') {
          throw new GraphQLError('Only cancelled bookings can be deleted');
        }

        // Delete the booking
        await BookingModel.findByIdAndDelete(bookingId);

        return {
          success: true,
          message: 'Booking deleted successfully'
        };
      } catch (error: any) {
        return {
          success: false,
          message: error.message
        };
      }
    },
  }
};