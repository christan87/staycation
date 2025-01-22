import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import FacebookProvider from 'next-auth/providers/facebook';
import CredentialsProvider from 'next-auth/providers/credentials';
import { verifyPassword } from '../../../utils/auth'; // Utility to verify password
import { connectToDatabase } from '../../../utils/db'; // Utility to connect to the database

if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
  throw new Error('Missing environment variables for Google authentication provider');
}

if (!process.env.FACEBOOK_CLIENT_ID || !process.env.FACEBOOK_CLIENT_SECRET) {
  throw new Error('Missing environment variables for Facebook authentication provider');
}

type Credentials = {
  email: string;
  password: string;
}

// Define the User interface
interface User {
  id: string; // Ensure this matches the ID type from your database
  email: string;
  name: string; // Make sure this aligns with your database schema
}

export default NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
    }),
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "text", placeholder: "your-email@example.com" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials: Credentials | undefined) {
        if (!credentials) {
          throw new Error('Credentials are required');
        }
        const client = await connectToDatabase();
        const usersCollection = client.db().collection('users');

        const user = await usersCollection.findOne({ email: credentials.email });
        if (!user) {
          throw new Error('No user found!');
        }

        const isValid = await verifyPassword(credentials.password, user.password);
        if (!isValid) {
          throw new Error('Invalid password!');
        }

        // Ensure this matches the expected User type
        return {
          id: user._id.toString(), // Convert ObjectId to string if necessary
          email: user.email,
          name: user.name || '', // Include name if available
        } as User; // Cast to User type
      }
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.email = user.email;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.email = token.email; // Assign the email from the token
    }
      return session;
    }
  },
  pages: {
    signIn: '/auth/signin',  // Custom sign-in page
  },
});