import { createYoga } from 'graphql-yoga';
import { createSchema } from 'graphql-yoga';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import dbConnect from '@/lib/mongodb';
import { typeDefs } from '@/graphql/schemas/schema';
import resolvers from '@/graphql/resolvers';
import { GraphQLError } from 'graphql';

interface Context {
  session: any;
}

// Create the schema using merged typeDefs and resolvers
const schema = createSchema({
  typeDefs,
  resolvers
});

// Create the yoga instance
const yoga = createYoga({
  schema,
  // Yoga configuration
  graphqlEndpoint: '/api/graphql',
  fetchAPI: { Response },
  context: async ({ request }): Promise<Context> => {
    await dbConnect();
    const session = await getServerSession(authOptions);
    return { session };
  }
});

// Export the yoga handler methods directly
const { handleRequest } = yoga;
export { handleRequest as GET, handleRequest as POST };
