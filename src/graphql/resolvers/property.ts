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

interface PageInfo {
  totalCount: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export const propertyResolvers = {
  Query: {
    property: async (_: any, { id }: { id: string }) => {
      try {
        console.log(`Property resolver called with ID: ${id}`);
        
        // Validate ID format
        if (!id) {
          console.error('Property ID is undefined or empty');
          throw new GraphQLError('Property ID is required');
        }
        
        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
          console.error(`Invalid property ID format: ${id}`);
          throw new GraphQLError(`Invalid property ID format: ${id}`);
        }

        console.log(`Finding property with ID: ${id}`);
        const property = await Property.findById(id)
          .populate('host')
          .populate({
            path: 'reviews',
            populate: {
              path: 'guest',
              select: 'id name image'
            }
          });

        if (!property) {
          console.error(`Property not found with ID: ${id}`);
          throw new GraphQLError(`Property not found with ID: ${id}`);
        }
        
        console.log(`Property found: ${property._id}`);
        const result = {
          ...property.toObject(),
          id: property._id.toString(),
        };
        
        // Add host data if it exists
        if (property.host) {
          result.host = {
            ...property.host.toObject(),
            id: property.host._id.toString()
          };
        } else {
          console.warn(`Property ${id} has no host data`);
        }
        
        // Add reviews if they exist
        if (property.reviews && property.reviews.length > 0) {
          result.reviews = property.reviews.map((review: any) => {
            const reviewObj = {
              ...review.toObject(),
              id: review._id.toString(),
            };
            
            // Add guest data if it exists
            if (review.guest) {
              reviewObj.guest = {
                ...review.guest,
                id: review.guest._id.toString()
              };
            } else {
              console.warn(`Review ${review._id} has no guest data`);
            }
            
            return reviewObj;
          });
        }
        
        return result;
      } catch (error) {
        console.error('Error in property resolver:', error);
        if (error instanceof GraphQLError) {
          throw error;
        }
        if (error instanceof Error) {
          console.error(`Stack trace: ${error.stack}`);
          throw new GraphQLError(`Failed to fetch property data: ${error.message}`);
        }
        throw new GraphQLError('Failed to fetch property data: Unknown error');
      }
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

        const totalCount = await Property.countDocuments(query);
        const properties = await Property.find(query)
          .populate('host')
          .limit(limit)
          .skip(offset)
          .sort({ createdAt: -1 })
          .lean()
          .exec();

        const items = (properties as MongoDocument[]).map(property => ({
          ...property,
          id: property._id.toString(),
          host: property.host ? {
            ...property.host,
            id: (property.host as MongoDocument)._id.toString()
          } : null
        }));

        const pageInfo: PageInfo = {
          totalCount,
          hasNextPage: offset + limit < totalCount,
          hasPreviousPage: offset > 0
        };

        return { items, pageInfo };
      } catch (error) {
        console.error('Error in properties resolver:', error);
        throw new GraphQLError(error instanceof Error ? error.message : 'Failed to fetch properties');
      }
    },

    myProperties: async (_: any, __: any, context: Context) => {
      if (!context.session?.user?.email) {
        throw new GraphQLError('Not authenticated', {
          extensions: { code: 'UNAUTHENTICATED' }
        });
      }

      try {
        const user = await User.findOne({ email: context.session.user.email });
        if (!user) {
          throw new GraphQLError('User not found');
        }

        const properties = await Property.find({ host: user._id })
          .populate('host')
          .populate({
            path: 'reviews',
            populate: {
              path: 'guest',
              select: 'id name image'
            }
          })
          .lean()
          .exec();

        return (properties as MongoDocument[]).map(property => ({
          ...property,
          id: property._id.toString(),
          host: property.host ? {
            ...property.host,
            id: property.host._id.toString()
          } : null,
          reviews: property.reviews?.map((review: any) => ({
            ...review,
            id: review._id.toString(),
            guest: {
              ...review.guest,
              id: review.guest?._id.toString()
            }
          })),
          createdAt: new Date(property.createdAt).toISOString(),
          updatedAt: new Date(property.updatedAt).toISOString()
        }));
      } catch (error) {
        console.error('Error fetching properties:', error);
        throw new GraphQLError('Failed to fetch properties');
      }
    },

    searchProperties: async (_: any, { 
      query,
      limit = 10,
      offset = 0
    }: { 
      query: string;
      limit?: number;
      offset?: number;
    }) => {
      try {
        const searchQuery = {
          $or: [
            { title: { $regex: query, $options: 'i' } },
            { description: { $regex: query, $options: 'i' } },
            { 'location.city': { $regex: query, $options: 'i' } },
            { 'location.state': { $regex: query, $options: 'i' } },
            { 'location.country': { $regex: query, $options: 'i' } }
          ]
        };

        const totalCount = await Property.countDocuments(searchQuery);
        const properties = await Property.find(searchQuery)
          .populate('host')
          .limit(limit)
          .skip(offset)
          .sort({ createdAt: -1 })
          .lean()
          .exec();

        const items = (properties as MongoDocument[]).map(property => ({
          ...property,
          id: property._id.toString(),
          host: property.host ? {
            ...property.host,
            id: (property.host as MongoDocument)._id.toString()
          } : null
        }));

        const pageInfo: PageInfo = {
          totalCount,
          hasNextPage: offset + limit < totalCount,
          hasPreviousPage: offset > 0
        };

        return { items, pageInfo };
      } catch (error) {
        console.error('Error in searchProperties:', error);
        throw new GraphQLError('Failed to search properties');
      }
    }
  },

  Mutation: {
    createProperty: async (_: any, { input }: { input: any }, context: Context) => {
      if (!context.session?.user?.email) {
        throw new GraphQLError('Not authenticated');
      }

      const user = await User.findOne({ email: context.session.user.email });
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
      
      return {
        ...property.toObject(),
        id: property._id.toString(),
        host: {
          ...property.host.toObject(),
          id: property.host._id.toString()
        }
      };
    },

    updateProperty: async (_: any, { input }: { input: any }, context: Context) => {
      if (!context.session?.user?.email) {
        throw new GraphQLError('Not authenticated');
      }

      const user = await User.findOne({ email: context.session.user.email });
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

      return {
        ...updatedProperty.toObject(),
        id: updatedProperty._id.toString(),
        host: {
          ...updatedProperty.host.toObject(),
          id: updatedProperty.host._id.toString()
        }
      };
    },

    deleteProperty: async (_: any, { id }: { id: string }, context: Context) => {
      if (!context.session?.user?.email) {
        throw new GraphQLError('Not authenticated');
      }

      const user = await User.findOne({ email: context.session.user.email });
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

      // Delete associated images from Cloudinary
      for (const image of property.images) {
        await deleteImage(image.publicId);
      }

      await Property.findByIdAndDelete(id);

      return {
        success: true,
        message: 'Property deleted successfully'
      };
    },

    becomeHost: async (_: any, __: any, context: Context) => {
      if (!context.session?.user?.email) {
        throw new GraphQLError('Not authenticated');
      }

      const user = await User.findOne({ email: context.session.user.email });
      if (!user) {
        throw new GraphQLError('User not found');
      }

      if (user.role === 'HOST' || user.role === 'ADMIN') {
        return {
          success: false,
          message: 'User is already a host',
          user: {
            id: user._id.toString(),
            role: user.role
          }
        };
      }

      user.role = 'HOST';
      await user.save();

      return {
        success: true,
        message: 'Successfully became a host',
        user: {
          id: user._id.toString(),
          role: user.role
        }
      };
    }
  }
};