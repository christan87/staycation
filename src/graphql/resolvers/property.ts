import { GraphQLError } from 'graphql';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Context } from '../types/context';
import { Property, IProperty } from '@/models/Property';
import { User, IUser } from '@/models/User';
import { Types } from 'mongoose';
import { deleteImage } from '@/lib/cloudinary';

interface PropertyImage {
  url: string;
  publicId: string;
}

// MongoDB document types
type MongoDocument = {
  _id: Types.ObjectId;
  [key: string]: any;
};

export const propertyResolvers = {
  Query: {
    property: async (_: any, { id }: { id: string }) => {
      const property = await Property.findById(id).populate('host');
      if (!property) {
        throw new GraphQLError('Property not found');
      }
      
      // Add default values for pet-friendly fields if they don't exist
      property.petFriendly = property.petFriendly ?? false;
      property.allowsCats = property.allowsCats ?? false;
      property.allowsDogs = property.allowsDogs ?? false;
      
      return property;
    },
    
    properties: async (_: any, { 
      limit = 10, 
      offset = 0, 
      filter 
    }: { 
      limit?: number; 
      offset?: number; 
      filter?: any;
    }) => {
      try {
        const query: any = {};
        
        if (filter) {
          if (filter.type) query.type = filter.type;
          if (filter.maxPrice) query.price = { $lte: filter.maxPrice };
          if (filter.minPrice) query.price = { ...query.price, $gte: filter.minPrice };
          if (filter.maxGuests) query.maxGuests = { $gte: filter.maxGuests };
          if (filter.location) {
            query.$or = [
              { 'location.city': { $regex: filter.location, $options: 'i' } },
              { 'location.state': { $regex: filter.location, $options: 'i' } },
              { 'location.country': { $regex: filter.location, $options: 'i' } }
            ];
          }
        }

        const properties = await Property.find(query)
          .populate('host')
          .limit(limit)
          .skip(offset)
          .sort({ createdAt: -1 })
          .lean()
          .exec();

        return (properties as MongoDocument[]).map(property => ({
          ...property,
          id: property._id.toString(),
          host: property.host ? {
            ...property.host,
            id: (property.host as MongoDocument)._id.toString()
          } : null
        }));
      } catch (error) {
        console.error('Error in properties resolver:', error);
        throw new GraphQLError(error instanceof Error ? error.message : 'Failed to fetch properties');
      }
    },

    myProperties: async (_: any, __: any, context: Context) => {
      if (!context.session) {
        throw new GraphQLError('Not authenticated', {
          extensions: { code: 'UNAUTHENTICATED' }
        });
      }

      try {
        const user = await User.findOne({ email: context.session.user?.email });
        if (!user) {
          throw new GraphQLError('User not found');
        }

        const properties = await Property.find({ host: user._id })
          .populate('host')
          .lean()
          .exec();

        // Transform properties to match GraphQL schema
        return (properties as MongoDocument[]).map(property => ({
          ...property,
          id: property._id.toString(),
          host: property.host ? {
            ...property.host,
            id: (property.host as MongoDocument)._id.toString()
          } : null,
          createdAt: new Date(property.createdAt).toISOString(),
          updatedAt: new Date(property.updatedAt).toISOString(),
          petFriendly: property.petFriendly ?? false,
          allowsCats: property.allowsCats ?? false,
          allowsDogs: property.allowsDogs ?? false,
          rating: property.rating ?? null,
          reviews: property.reviews ?? []
        }));
      } catch (error) {
        console.error('Error fetching properties:', error);
        throw new GraphQLError('Failed to fetch properties');
      }
    },

    searchProperties: async (_: any, { query }: { query: string }) => {
      return await Property.find({
        $or: [
          { title: { $regex: query, $options: 'i' } },
          { description: { $regex: query, $options: 'i' } },
          { 'location.city': { $regex: query, $options: 'i' } },
          { 'location.state': { $regex: query, $options: 'i' } },
          { 'location.country': { $regex: query, $options: 'i' } }
        ]
      }).populate('host');
    }
  },

  Mutation: {
    createProperty: async (_: any, { input }: { input: any }, context: Context) => {
      const session = await getServerSession(authOptions);
      if (!session?.user?.email) {
        throw new GraphQLError('Not authenticated');
      }

      const user = await User.findOne({ email: session.user.email });
      if (!user) {
        throw new GraphQLError('User not found');
      }

      if (user.role !== 'HOST' && user.role !== 'ADMIN') {
        throw new GraphQLError('Not authorized to create properties');
      }

      const property = new Property({
        ...input,
        host: user._id,
        petFriendly: input.petFriendly ?? false,
        allowsCats: input.allowsCats ?? false,
        allowsDogs: input.allowsDogs ?? false,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      await property.save();
      await property.populate('host');
      
      return property;
    },

    updateProperty: async (_: any, { input }: { input: any }, context: Context) => {
      const session = await getServerSession(authOptions);
      if (!session?.user?.email) {
        throw new GraphQLError('Not authenticated');
      }

      const user = await User.findOne({ email: session.user.email });
      if (!user) {
        throw new GraphQLError('User not found');
      }

      const property = await Property.findById(input.id);
      if (!property) {
        throw new GraphQLError('Property not found');
      }

      if (property.host.toString() !== user._id.toString() && user.role !== 'ADMIN') {
        throw new GraphQLError('Not authorized to update this property');
      }

      const updatedProperty = await Property.findByIdAndUpdate(
        input.id,
        {
          ...input,
          updatedAt: new Date()
        },
        { new: true }
      ).populate('host');

      return updatedProperty;
    },

    deleteProperty: async (_: any, { id }: { id: string }, context: Context) => {
      const session = await getServerSession(authOptions);
      if (!session?.user?.email) {
        throw new GraphQLError('Not authenticated');
      }

      const user = await User.findOne({ email: session.user.email });
      if (!user) {
        throw new GraphQLError('User not found');
      }

      const property = await Property.findById(id);
      if (!property) {
        throw new GraphQLError('Property not found');
      }

      if (property.host.toString() !== user._id.toString() && user.role !== 'ADMIN') {
        throw new GraphQLError('Not authorized to delete this property');
      }

      try {
        // Delete all associated images from Cloudinary
        const deletePromises = (property.images as (MongoDocument & PropertyImage)[]).map(async (image) => {
          if (image.publicId) {
            try {
              await deleteImage(image.publicId);
            } catch (error) {
              console.error(`Failed to delete image ${image.publicId}:`, error);
              // Continue with other deletions even if one fails
            }
          }
        });

        // Wait for all image deletions to complete
        await Promise.all(deletePromises);

        // Delete the property from the database
        await Property.findByIdAndDelete(id);
        
        return true;
      } catch (error) {
        console.error('Error deleting property:', error);
        throw new GraphQLError('Failed to delete property and its associated images');
      }
    }
  }
};