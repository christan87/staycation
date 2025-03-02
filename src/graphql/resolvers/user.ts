import { GraphQLError } from 'graphql';
import { Context } from '../types/context';
import { User } from '@/models/User';

export const userResolvers = {
  Query: {
    me: async (_: any, __: any, context: Context) => {
      try {
        console.log('me query called with context:', {
          session: context.session,
          email: context.session?.user?.email
        });

        if (!context.session?.user?.email) {
          throw new GraphQLError('Not authenticated');
        }

        const user = await User.findOne({ email: context.session.user.email })
          .populate('properties')
          .populate('bookings')
          .populate('reviews');
          
        console.log('User found:', user ? { id: user._id, role: user.role } : 'No user found');

        if (!user) {
          throw new GraphQLError('User not found');
        }

        return user;
      } catch (error) {
        console.error('Error in me query:', error);
        throw new GraphQLError(error instanceof Error ? error.message : 'Unexpected error in me query');
      }
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
      try {
        console.log('updateUser mutation called with context:', {
          session: context.session,
          email: context.session?.user?.email,
          input
        });
        
        if (!context.session?.user?.email) {
          throw new GraphQLError('Not authenticated');
        }

        const user = await User.findOne({ email: context.session.user.email });
        console.log('User found:', user ? { id: user._id, role: user.role } : 'No user found');
        
        if (!user) {
          throw new GraphQLError('User not found');
        }

        console.log('Updating user with input:', input);
        const updatedUser = await User.findByIdAndUpdate(
          user._id,
          { $set: input },
          { new: true }
        )
          .populate('properties')
          .populate('bookings')
          .populate('reviews');
        
        console.log('User updated successfully');

        return {
          success: true,
          message: 'User updated successfully',
          user: updatedUser
        };
      } catch (error) {
        console.error('Error in updateUser mutation:', error);
        throw new GraphQLError(error instanceof Error ? error.message : 'Unexpected error in updateUser');
      }
    },

    deleteUser: async (_: any, __: any, context: Context) => {
      try {
        console.log('deleteUser mutation called with context:', {
          session: context.session,
          email: context.session?.user?.email
        });
        
        if (!context.session?.user?.email) {
          throw new GraphQLError('Not authenticated');
        }

        const user = await User.findOne({ email: context.session.user.email });
        console.log('User found:', user ? { id: user._id, role: user.role } : 'No user found');
        
        if (!user) {
          throw new GraphQLError('User not found');
        }

        console.log('Deleting user:', user._id);
        await User.findByIdAndDelete(user._id);
        console.log('User deleted successfully');

        return {
          success: true,
          message: 'User deleted successfully'
        };
      } catch (error) {
        console.error('Error in deleteUser mutation:', error);
        throw new GraphQLError(error instanceof Error ? error.message : 'Unexpected error in deleteUser');
      }
    },

    becomeHost: async (_: any, __: any, context: Context) => {
      try {
        console.log('becomeHost resolver called with context:', {
          session: context.session,
          email: context.session?.user?.email
        });
        
        if (!context.session?.user?.email) {
          throw new GraphQLError('Not authenticated');
        }

        const user = await User.findOne({ email: context.session.user.email });
        console.log('User found:', user ? { id: user._id, role: user.role } : 'No user found');
        
        if (!user) {
          throw new GraphQLError('User not found');
        }

        if (user.role === 'HOST' || user.role === 'ADMIN') {
          console.log('User is already a host or admin');
          return {
            success: false,
            message: 'User is already a host',
            user: {
              id: user._id.toString(),
              role: user.role,
              name: user.name,
              email: user.email,
              image: user.image
            }
          };
        }

        console.log('Updating user role to HOST');
        user.role = 'HOST';
        await user.save();
        console.log('User role updated successfully');

        return {
          success: true,
          message: 'Successfully became a host',
          user: {
            id: user._id.toString(),
            role: user.role,
            name: user.name,
            email: user.email,
            image: user.image
          }
        };
      } catch (error) {
        console.error('Error in becomeHost resolver:', error);
        throw new GraphQLError(error instanceof Error ? error.message : 'Unexpected error in becomeHost');
      }
    }
  }
};