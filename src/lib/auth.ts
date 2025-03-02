import type { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import FacebookProvider from 'next-auth/providers/facebook';
import CredentialsProvider from 'next-auth/providers/credentials';
import dbConnect from '@/lib/mongodb';
import { User } from '@/models/User';
import bcrypt from 'bcryptjs';

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID!,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        name: { label: "Name", type: "text" },
        isRegistering: { label: "Is Registering", type: "boolean" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Please enter an email and password');
        }

        await dbConnect();

        if (credentials.isRegistering === 'true') {
          if (!credentials.name) {
            throw new Error('Please enter a name');
          }

          const existingUser = await User.findOne({ email: credentials.email });
          if (existingUser) {
            throw new Error('User already exists');
          }

          const hashedPassword = await bcrypt.hash(credentials.password, 12);

          const user = await User.create({
            name: credentials.name,
            email: credentials.email,
            password: hashedPassword,
            role: 'GUEST', // Use GUEST as the database role
          });

          return {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            role: user.role,
          };
        } else {
          const user = await User.findOne({ email: credentials.email });
          if (!user) {
            throw new Error('No user found');
          }

          const isValid = await bcrypt.compare(credentials.password, user.password);
          if (!isValid) {
            throw new Error('Invalid password');
          }

          return {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            role: user.role,
          };
        }
      },
    }),
  ],
  pages: {
    signIn: '/login',
    error: '/login',
    signOut: '/login',
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      // Only process for OAuth providers
      if (account && account.provider && (account.provider === 'google' || account.provider === 'facebook')) {
        try {
          await dbConnect();
          
          // Check if user already exists in our database
          const existingUser = await User.findOne({ email: user.email });
          
          if (existingUser) {
            // Update provider info if needed
            if (!existingUser.provider || !existingUser.providerId) {
              existingUser.provider = account.provider;
              existingUser.providerId = account.providerAccountId;
              await existingUser.save();
              console.log(`Updated OAuth provider info for existing user: ${user.email}`);
            }
          } else {
            // Create new user with OAuth info
            await User.create({
              name: user.name,
              email: user.email,
              image: user.image,
              provider: account.provider,
              providerId: account.providerAccountId,
              role: 'GUEST', // Default role for new users
              emailVerified: true // OAuth emails are verified
            });
            console.log(`Created new user from OAuth: ${user.email}`);
          }
        } catch (error) {
          console.error('Error in signIn callback:', error);
          // Still allow sign in even if our DB operations fail
        }
      }
      return true;
    },
    async jwt({ token, user, trigger }) {
      // If this is a sign-in event, user object is available
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.provider = user.provider;
        
        // Map database role to session role
        if (user.role === 'GUEST') {
          token.role = 'USER';
        } else if (user.role === 'HOST' || user.role === 'ADMIN') {
          token.role = user.role;
        } else {
          token.role = 'USER'; // Default fallback
        }
        console.log(`JWT callback - User ID: ${user.id}, Email: ${user.email}, Role: ${user.role}, Token role: ${token.role}`);
      } 
      
      // On every JWT refresh, fetch the latest user data from the database
      if (token?.id) {
        try {
          await dbConnect();
          console.log(`Looking up user with ID: ${token.id}`);
          
          let currentUser = null;
          
          // Check if the ID is a valid MongoDB ObjectId
          const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(token.id);
          
          if (isValidObjectId) {
            // Try to find by _id if it's a valid ObjectId
            currentUser = await User.findById(token.id).select('role');
            console.log(`Lookup by ObjectId ${isValidObjectId ? 'succeeded' : 'failed'}`);
          }
          
          // If not found or not a valid ObjectId, try by providerId (for OAuth users)
          if (!currentUser) {
            console.log(`Looking up by providerId: ${token.id}`);
            currentUser = await User.findOne({ providerId: token.id }).select('role');
            
            if (!currentUser) {
              // Also try by email if we have it
              if (token.email) {
                console.log(`Looking up by email: ${token.email}`);
                currentUser = await User.findOne({ email: token.email }).select('role');
              }
            }
          }
          
          if (currentUser) {
            console.log(`JWT refresh - Found user with role: ${currentUser.role}`);
            
            // Update token with current role from database
            if (currentUser.role === 'GUEST') {
              token.role = 'USER';
            } else if (currentUser.role === 'HOST' || currentUser.role === 'ADMIN') {
              token.role = currentUser.role;
            } else {
              token.role = 'USER';
            }
          } else {
            console.log(`JWT refresh - User not found in database: ${token.id}`);
          }
        } catch (error) {
          console.error('Error fetching user in JWT callback:', error);
        }
      }
      
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string || session.user.email;
        console.log(`Session callback - Token ID: ${token.id}, Email: ${token.email}, Token role: ${token.role}`);
        
        // Ensure we only assign valid role types
        if (token.role === 'HOST' || token.role === 'ADMIN' || token.role === 'USER') {
          session.user.role = token.role;
        } else {
          console.log(`Session callback - Invalid role in token: ${token.role}, defaulting to USER`);
          session.user.role = 'USER'; // Default fallback
        }
        console.log(`Session callback - Final session user role: ${session.user.role}`);
      } else {
        console.log('Session callback - No session.user object found');
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Handle redirect after sign in
      if (url.startsWith('/')) return `${baseUrl}${url}`
      else if (new URL(url).origin === baseUrl) return url
      return baseUrl
    }
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
}

// Ensure NEXTAUTH_URL is set in production
if (process.env.VERCEL_URL && !process.env.NEXTAUTH_URL) {
  process.env.NEXTAUTH_URL = `https://${process.env.VERCEL_URL}`;
}