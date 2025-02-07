import { createYoga } from 'graphql-yoga';
import { createSchema } from 'graphql-yoga';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import dbConnect from '@/lib/mongodb';
import { typeDefs } from '@/graphql/schemas/schema';
import resolvers from '@/graphql/resolvers';
import { GraphQLError } from 'graphql';
import { Session } from 'next-auth';

interface Context {
  session: Session | null;
}

// Create the schema using merged typeDefs and resolvers
const schema = createSchema<Context>({
  typeDefs,
  resolvers
});

// Define allowed origins
const allowedOrigins = [
  'http://localhost:3000',
  process.env.NEXT_PUBLIC_APP_URL
].filter((origin): origin is string => !!origin);

// Create the yoga instance
const yoga = createYoga<Context>({
  schema,
  graphqlEndpoint: '/api/graphql',
  fetchAPI: { Response },
  maskedErrors: false, // Show actual errors in development
  context: async ({ request }): Promise<Context> => {
    try {
      await dbConnect();
      const session = await getServerSession(authOptions);
      
      return {
        session
      };
    } catch (error) {
      console.error('Error in GraphQL context:', error);
      throw new GraphQLError('Failed to initialize GraphQL context', {
        extensions: {
          code: 'INTERNAL_SERVER_ERROR'
        }
      });
    }
  },
  // Configure CORS properly
  cors: {
    origin: allowedOrigins,
    credentials: true,
    methods: ['POST', 'GET', 'OPTIONS']
  },
  // Development features
  graphiql: process.env.NODE_ENV === 'development',
  landingPage: false,
  multipart: false
});

// Export the yoga handler methods directly
const { handleRequest } = yoga;
export { handleRequest as GET, handleRequest as POST };
