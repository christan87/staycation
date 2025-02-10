import { GraphQLError } from 'graphql';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Context } from '../types/context';
import { User } from '@/models/User';

export const userResolvers = {
  Query: {
    me: async (_: any, __: any, context: Context) => {
      const session = await getServerSession(authOptions);
      if (!session?.user?.email) {
        throw new GraphQLError('Not authenticated');
      }

      const user = await User.findOne({ email: session.user.email })
        .populate('properties')
        .populate('bookings')
        .populate('reviews');
        
      if (!user) {
        throw new GraphQLError('User not found');
      }

      return user;
    },

    user: async (_: any, { id }: { id: string }, context: Context) => {
      const user = await User.findById(id)
        .populate('properties')
        .populate('bookings')
        .populate('reviews');
        
      if (!user) {
        throw new GraphQLError('User not found');
      }

      return user;
    }
  },

  Mutation: {
    updateUser: async (_: any, { input }: { input: any }, context: Context) => {
      const session = await getServerSession(authOptions);
      if (!session?.user?.email) {
        throw new GraphQLError('Not authenticated');
      }

      const user = await User.findOne({ email: session.user.email });
      if (!user) {
        throw new GraphQLError('User not found');
      }

      const updatedUser = await User.findByIdAndUpdate(
        user._id,
        { $set: input },
        { new: true }
      )
        .populate('properties')
        .populate('bookings')
        .populate('reviews');

      return {
        success: true,
        message: 'User updated successfully',
        user: updatedUser
      };
    },

    deleteUser: async (_: any, __: any, context: Context) => {
      const session = await getServerSession(authOptions);
      if (!session?.user?.email) {
        throw new GraphQLError('Not authenticated');
      }

      const user = await User.findOne({ email: session.user.email });
      if (!user) {
        throw new GraphQLError('User not found');
      }

      await User.findByIdAndDelete(user._id);

      return {
        success: true,
        message: 'User deleted successfully'
      };
    },

    becomeHost: async (_: any, __: any, context: Context) => {
      const session = await getServerSession(authOptions);
      if (!session?.user?.email) {
        throw new GraphQLError('Not authenticated');
      }

      const user = await User.findOne({ email: session.user.email });
      if (!user) {
        throw new GraphQLError('User not found');
      }

      if (user.role === 'HOST') {
        throw new GraphQLError('User is already a host');
      }

      const updatedUser = await User.findByIdAndUpdate(
        user._id,
        { $set: { role: 'HOST' } },
        { new: true }
      )
        .populate('properties')
        .populate('bookings')
        .populate('reviews');

      return {
        success: true,
        message: 'Successfully became a host',
        user: updatedUser
      };
    }
  }
};