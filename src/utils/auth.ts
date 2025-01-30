import bcrypt from 'bcryptjs';
import { getSession } from 'next-auth/react';
import { GetServerSidePropsContext } from 'next';
import { User } from '../models/User';
import jwt from 'jsonwebtoken';

// Verify password
export async function verifyPassword(password: string, hashedPassword: string) {
  return await bcrypt.compare(password, hashedPassword);
}

// Get authenticated user from session
export async function getAuthenticatedUser(context: GetServerSidePropsContext) {
  const session = await getSession(context);
  
  if (!session?.user?.email) {
    return null;
  }

  const user = await User.findOne({ email: session.user.email });
  return user;
}

// Check if user has required role
export async function checkUserRole(context: GetServerSidePropsContext, requiredRoles: string[]) {
  const user = await getAuthenticatedUser(context);
  
  if (!user) {
    return false;
  }

  return requiredRoles.includes(user.role);
}

// Create auth error with message
export function createAuthError(message: string) {
  return new Error(`Authentication Error: ${message}`);
}

// Validate email format
export function isValidEmail(email: string) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Validate password strength
export function isStrongPassword(password: string) {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/;
  return passwordRegex.test(password);
}

// Sign JWT token
export function signToken(user: any) {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }

  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      role: user.role
    },
    secret,
    { expiresIn: '24h' }
  );
}

// Verify JWT token
export function verifyToken(token: string) {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }

  try {
    return jwt.verify(token, secret);
  } catch (error) {
    throw createAuthError('Invalid or expired token');
  }
}