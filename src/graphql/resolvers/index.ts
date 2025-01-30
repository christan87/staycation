// src/graphql/resolvers/index.ts
import { mergeResolvers } from '@graphql-tools/merge';
import { propertyResolvers } from './property';
import { userResolvers } from './user';
import { reviewResolvers } from './review';
import { bookingResolvers } from './booking';
import { imageUploadResolvers } from './imageUpload';

const resolvers = [
  propertyResolvers,
  userResolvers,
  reviewResolvers,
  bookingResolvers,
  imageUploadResolvers
];

export default mergeResolvers(resolvers);