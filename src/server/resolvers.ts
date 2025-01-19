import { User, Property, Booking, Review } from './models';
import { Types } from 'mongoose';
import { GraphQLResolveInfo } from 'graphql';

// Define the context type
interface Context {
  userId: string | null;
}

// Define the resolver types
type Resolver<TArgs = any, TReturn = any> = (
  parent: any,
  args: TArgs,
  context: Context,
  info: GraphQLResolveInfo
) => Promise<TReturn> | TReturn;

// Input types
interface PropertyFilters {
  location?: string;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  maxGuests?: number;
}

interface BookingInput {
  checkIn: string;
  checkOut: string;
  guestCount: number;
}

interface ReviewInput {
  rating: number;
  comment: string;
}

interface PropertyInput {
  title: string;
  description: string;
  location: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  maxGuests: number;
  amenities: string[];
  images: string[];
}

// Enum type
enum BookingStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED'
}

export const resolvers = {
  Query: {
    properties: async (
      _: any,
      args: PropertyFilters,
      context: Context
    ) => {
      const filter: any = {};
      
      if (args.location) {
        filter.location = { $regex: args.location, $options: 'i' };
      }
      if (args.minPrice) {
        filter.price = { $gte: args.minPrice };
      }
      if (args.maxPrice) {
        filter.price = { ...filter.price, $lte: args.maxPrice };
      }
      if (args.bedrooms) {
        filter.bedrooms = args.bedrooms;
      }
      if (args.maxGuests) {
        filter.maxGuests = { $gte: args.maxGuests };
      }

      return await Property.find(filter).populate('host');
    },

    property: async (
      _: any,
      { id }: { id: string },
      context: Context
    ) => {
      return await Property.findById(id).populate('host');
    },

    user: async (
      _: any,
      { id }: { id: string },
      context: Context
    ) => {
      return await User.findById(id);
    },

    bookings: async (
      _: any,
      { userId }: { userId: string },
      context: Context
    ) => {
      if (!context.userId) {
        throw new Error('You must be logged in to view bookings');
      }
      return await Booking.find({ guest: userId })
        .populate('property')
        .populate('guest');
    },
  },

  Mutation: {
    createProperty: async (
      _: any,
      { input }: { input: PropertyInput },
      context: Context
    ) => {
      if (!context.userId) {
        throw new Error('You must be logged in to create a property');
      }

      const property = new Property({
        ...input,
        host: new Types.ObjectId(context.userId)
      });
      await property.save();
      return property.populate('host');
    },

    updateProperty: async (
      _: any,
      { id, input }: { id: string; input: Partial<PropertyInput> },
      context: Context
    ) => {
      if (!context.userId) {
        throw new Error('You must be logged in to update a property');
      }

      const property = await Property.findById(id);
      if (!property) {
        throw new Error('Property not found');
      }

      if (property.host.toString() !== context.userId) {
        throw new Error('You can only update your own properties');
      }

      const updated = await Property.findByIdAndUpdate(
        id,
        { $set: input },
        { new: true }
      ).populate('host');
      
      return updated;
    },

    deleteProperty: async (
      _: any,
      { id }: { id: string },
      context: Context
    ) => {
      if (!context.userId) {
        throw new Error('You must be logged in to delete a property');
      }

      const property = await Property.findById(id);
      if (!property) {
        throw new Error('Property not found');
      }

      if (property.host.toString() !== context.userId) {
        throw new Error('You can only delete your own properties');
      }

      await Property.findByIdAndDelete(id);
      // Clean up related bookings and reviews
      await Booking.deleteMany({ property: id });
      await Review.deleteMany({ property: id });
      return true;
    },

    createBooking: async (
      _: any,
      { propertyId, input }: { propertyId: string; input: BookingInput },
      context: Context
    ) => {
      if (!context.userId) {
        throw new Error('You must be logged in to create a booking');
      }

      const property = await Property.findById(propertyId);
      if (!property) {
        throw new Error('Property not found');
      }

      // Check if the property is available for the requested dates
      const existingBooking = await Booking.findOne({
        property: propertyId,
        status: { $in: [BookingStatus.PENDING, BookingStatus.CONFIRMED] },
        $or: [
          {
            checkIn: { $lte: new Date(input.checkOut) },
            checkOut: { $gte: new Date(input.checkIn) }
          }
        ]
      });

      if (existingBooking) {
        throw new Error('Property is not available for the selected dates');
      }

      const booking = new Booking({
        property: propertyId,
        guest: new Types.ObjectId(context.userId),
        checkIn: new Date(input.checkIn),
        checkOut: new Date(input.checkOut),
        guestCount: input.guestCount,
        totalPrice: property.price * Math.ceil(
          (new Date(input.checkOut).getTime() - new Date(input.checkIn).getTime()) / 
          (1000 * 60 * 60 * 24)
        ),
        status: BookingStatus.PENDING
      });

      await booking.save();
      return booking.populate(['property', 'guest']);
    },

    updateBookingStatus: async (
      _: any,
      { id, status }: { id: string; status: BookingStatus },
      context: Context
    ) => {
      if (!context.userId) {
        throw new Error('You must be logged in to update a booking');
      }

      const booking = await Booking.findById(id);
      if (!booking) {
        throw new Error('Booking not found');
      }

      // Only allow the property host or the guest to update the booking status
      const property = await Property.findById(booking.property);
      if (!property) {
        throw new Error('Property not found');
      }

      if (property.host.toString() !== context.userId && booking.guest.toString() !== context.userId) {
        throw new Error('You can only update bookings for your properties or your own bookings');
      }

      const updatedBooking = await Booking.findByIdAndUpdate(
        id,
        { status },
        { new: true }
      ).populate(['property', 'guest']);

      return updatedBooking;
    },

    createReview: async (
      _: any,
      { propertyId, input }: { propertyId: string; input: ReviewInput },
      context: Context
    ) => {
      if (!context.userId) {
        throw new Error('You must be logged in to create a review');
      }

      const property = await Property.findById(propertyId);
      if (!property) {
        throw new Error('Property not found');
      }

      // Check if user has actually booked and completed their stay
      const validBooking = await Booking.findOne({
        property: propertyId,
        guest: new Types.ObjectId(context.userId),
        status: BookingStatus.COMPLETED,
      });

      if (!validBooking) {
        throw new Error('You can only review properties where you have completed a stay');
      }

      // Check if user has already reviewed this property
      const existingReview = await Review.findOne({
        property: propertyId,
        author: new Types.ObjectId(context.userId)
      });

      if (existingReview) {
        throw new Error('You have already reviewed this property');
      }

      const review = new Review({
        property: propertyId,
        author: new Types.ObjectId(context.userId),
        ...input
      });

      await review.save();
      return review.populate(['property', 'author']);
    },
  },

  Property: {
    bookings: async (property: any, _: any, context: Context) => {
      if (!context.userId) return [];
      return await Booking.find({ property: property._id }).populate(['guest', 'property']);
    },
    reviews: async (property: any) => {
      return await Review.find({ property: property._id }).populate(['author', 'property']);
    },
  },

  User: {
    properties: async (user: any) => {
      return await Property.find({ host: user._id }).populate('host');
    },
    bookings: async (user: any, _: any, context: Context) => {
      if (!context.userId) return [];
      return await Booking.find({ guest: user._id }).populate(['property', 'guest']);
    },
    reviews: async (user: any) => {
      return await Review.find({ author: user._id }).populate(['property', 'author']);
    },
  },
};
