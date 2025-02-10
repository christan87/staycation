import { createYoga, createSchema } from 'graphql-yoga';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import { typeDefs } from '@/graphql/schemas/schema';
import resolvers from '@/graphql/resolvers';
import { GraphQLError } from 'graphql';
import { Session } from 'next-auth';

interface Context {
  session: Session | null;
}

const schema = createSchema<Context>({
  typeDefs,
  resolvers
});

const allowedOrigins = [
  'http://localhost:3000',
  process.env.NEXT_PUBLIC_APP_URL
].filter((origin): origin is string => !!origin);

const yoga = createYoga<Context>({
  schema,
  graphqlEndpoint: '/api/graphql',
  maskedErrors: false,
  context: async ({ request }) => {
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
  cors: {
    origin: allowedOrigins,
    credentials: true,
    methods: ['POST', 'GET', 'OPTIONS']
  },
  graphiql: process.env.NODE_ENV === 'development',
  landingPage: false,
  multipart: false
});

// Export route handlers that conform to Next.js App Router types
export async function GET(request: Request) {
  return yoga.fetch(request);
}

export async function POST(request: Request) {
  return yoga.fetch(request);
}
