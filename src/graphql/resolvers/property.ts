import { GraphQLError } from 'graphql';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { Context } from '../types/context';
import { Property } from '@/models/Property';
import { User } from '@/models/User';

export const propertyResolvers = {
  Query: {
    property: async (_: any, { id }: { id: string }) => {
      const property = await Property.findById(id).populate('host');
      if (!property) {
        throw new GraphQLError('Property not found');
      }
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

      const total = await Property.countDocuments(query);
      const properties = await Property.find(query)
        .populate('host')
        .limit(limit)
        .skip(offset)
        .sort({ createdAt: -1 });

      return properties;
    },

    myProperties: async (_: any, __: any, context: Context) => {
      const session = await getServerSession(authOptions);
      if (!session?.user?.email) {
        throw new GraphQLError('Not authenticated');
      }

      const user = await User.findOne({ email: session.user.email });
      if (!user) {
        throw new GraphQLError('User not found');
      }

      return await Property.find({ host: user._id }).populate('host');
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

      await Property.findByIdAndDelete(id);
      return true;
    }
  }
};