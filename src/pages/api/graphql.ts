import { NextApiRequest, NextApiResponse } from 'next';
import { createYoga, createSchema } from 'graphql-yoga';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import { typeDefs } from '@/graphql/schemas/schema';
import resolvers from '@/graphql/resolvers';
import { GraphQLError } from 'graphql';
import { Session } from 'next-auth';
import { YogaInitialContext } from 'graphql-yoga';

interface GraphQLContext extends YogaInitialContext {
  session: Session | null;
}

const schema = createSchema<GraphQLContext>({
  typeDefs,
  resolvers
});

const allowedOrigins = [
  'http://localhost:3000',
  process.env.NEXT_PUBLIC_APP_URL
].filter((origin): origin is string => !!origin);

export const config = {
  api: {
    bodyParser: false,
  },
};

const yoga = createYoga<GraphQLContext>({
  schema,
  graphqlEndpoint: '/api/graphql',
  maskedErrors: false,
  context: async ({ request }) => {
    try {
      await dbConnect();
      
      // Get session from request
      let session = null;
      const authHeader = request.headers.get('Authorization');
      if (authHeader?.startsWith('Bearer ')) {
        // You might want to validate the token here
        // For now, we'll just use it as is
        const token = authHeader.split(' ')[1];
        session = { user: { id: token } } as Session;
      }
      
      return {
        session,
        request
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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Get raw body from request
    const chunks = [];
    for await (const chunk of req) {
      chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
    }
    const rawBody = Buffer.concat(chunks).toString('utf-8');

    // Create a proper URL for the Request object
    const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';
    const host = req.headers.host || 'localhost:3000';
    const url = new URL(req.url || '/api/graphql', `${protocol}://${host}`);

    // Convert NextApiRequest to Request
    const request = new Request(url, {
      method: req.method || 'POST',
      headers: new Headers(req.headers as HeadersInit),
      body: rawBody || null,
    });

    const response = await yoga.fetch(request);

    // Set the response status
    res.status(response.status);

    // Set the response headers
    response.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });

    // Send the response body
    const body = await response.text();
    res.send(body);
  } catch (error) {
    console.error('Error in GraphQL handler:', error);
    res.status(500).json({
      errors: [{ message: 'Internal server error' }]
    });
  }
}