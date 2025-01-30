import { GraphQLError } from 'graphql';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { Context } from '../types/context';
import { Review } from '@/models/Review';
import { User } from '@/models/User';
import { Property } from '@/models/Property';

export const reviewResolvers = {
  Query: {
    propertyReviews: async (_: any, { propertyId }: { propertyId: string }) => {
      return await Review.find({ property: propertyId })
        .populate('guest')
        .populate('property')
        .sort({ createdAt: -1 });
    },

    userReviews: async (_: any, { userId }: { userId: string }) => {
      return await Review.find({ guest: userId })
        .populate('guest')
        .populate('property')
        .sort({ createdAt: -1 });
    }
  },

  Mutation: {
    createReview: async (_: any, { input }: { input: any }, context: Context) => {
      const session = await getServerSession(authOptions);
      if (!session?.user?.email) {
        throw new GraphQLError('Not authenticated');
      }

      const user = await User.findOne({ email: session.user.email });
      if (!user) {
        throw new GraphQLError('User not found');
      }

      const property = await Property.findById(input.propertyId);
      if (!property) {
        throw new GraphQLError('Property not found');
      }

      // Check if user has already reviewed this property
      const existingReview = await Review.findOne({
        property: input.propertyId,
        guest: user._id
      });

      if (existingReview) {
        throw new GraphQLError('You have already reviewed this property');
      }

      const review = new Review({
        ...input,
        property: input.propertyId,
        guest: user._id
      });

      await review.save();
      await review.populate('guest');
      await review.populate('property');

      // Update property rating
      const reviews = await Review.find({ property: input.propertyId });
      const averageRating = reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length;
      await Property.findByIdAndUpdate(input.propertyId, { rating: averageRating });

      return {
        success: true,
        message: 'Review created successfully',
        review
      };
    },

    updateReview: async (_: any, { input }: { input: any }, context: Context) => {
      const session = await getServerSession(authOptions);
      if (!session?.user?.email) {
        throw new GraphQLError('Not authenticated');
      }

      const user = await User.findOne({ email: session.user.email });
      if (!user) {
        throw new GraphQLError('User not found');
      }

      const review = await Review.findById(input.reviewId);
      if (!review) {
        throw new GraphQLError('Review not found');
      }

      if (review.guest.toString() !== user._id.toString() && user.role !== 'ADMIN') {
        throw new GraphQLError('Not authorized to update this review');
      }

      const updatedReview = await Review.findByIdAndUpdate(
        input.reviewId,
        { $set: input },
        { new: true }
      )
        .populate('guest')
        .populate('property');

      // Update property rating
      const reviews = await Review.find({ property: review.property });
      const averageRating = reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length;
      await Property.findByIdAndUpdate(review.property, { rating: averageRating });

      return {
        success: true,
        message: 'Review updated successfully',
        review: updatedReview
      };
    },

    deleteReview: async (_: any, { reviewId }: { reviewId: string }, context: Context) => {
      const session = await getServerSession(authOptions);
      if (!session?.user?.email) {
        throw new GraphQLError('Not authenticated');
      }

      const user = await User.findOne({ email: session.user.email });
      if (!user) {
        throw new GraphQLError('User not found');
      }

      const review = await Review.findById(reviewId);
      if (!review) {
        throw new GraphQLError('Review not found');
      }

      if (review.guest.toString() !== user._id.toString() && user.role !== 'ADMIN') {
        throw new GraphQLError('Not authorized to delete this review');
      }

      await Review.findByIdAndDelete(reviewId);

      // Update property rating
      const reviews = await Review.find({ property: review.property });
      const averageRating = reviews.length 
        ? reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length
        : null;
      await Property.findByIdAndUpdate(review.property, { rating: averageRating });

      return {
        success: true,
        message: 'Review deleted successfully'
      };
    }
  }
};