/**
 * User Model
 * 
 * This file defines the Mongoose schema and model for users in the system.
 * It includes:
 * - User schema definition with validation
 * - Password hashing middleware
 * - Methods for password comparison and role checking
 * - TypeScript interfaces for type safety
 */

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

/**
 * Interface defining the shape of a User document
 */
export interface IUser {
  /** User's full name */
  name: string;
  /** User's email address (unique) */
  email: string;
  /** Hashed password (optional for OAuth users) */
  password?: string;
  /** Profile image URL */
  image?: string;
  /** Date when email was verified */
  emailVerified?: Date;
  /** Authentication provider (e.g., 'google', 'github') */
  provider?: string;
  /** User's role in the system */
  role: 'USER' | 'HOST' | 'ADMIN';
  /** Timestamp of user creation */
  createdAt: Date;
  /** Timestamp of last update */
  updatedAt: Date;
}

/**
 * Mongoose schema for the User model
 * Includes validation rules and default values
 */
const userSchema = new mongoose.Schema<IUser>({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    select: false, // Don't include password by default in queries
    minlength: [8, 'Password must be at least 8 characters long'],
  },
  image: String,
  emailVerified: Date,
  provider: String,
  role: {
    type: String,
    enum: ['USER', 'HOST', 'ADMIN'],
    default: 'USER',
  },
}, {
  timestamps: true,
});

/**
 * Pre-save middleware to hash password before saving
 * Only hashes the password if it has been modified
 */
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password!, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

/**
 * Method to compare a candidate password with the user's hashed password
 * @param candidatePassword - The password to check
 * @returns Promise resolving to true if passwords match, false otherwise
 */
userSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    return false;
  }
};

/**
 * Method to check if user has permission to host properties
 * @returns boolean indicating if user can host properties
 */
userSchema.methods.canHost = function(): boolean {
  return this.role === 'HOST' || this.role === 'ADMIN';
};

// Create or retrieve the User model
export const User = mongoose.models.User || mongoose.model<IUser>('User', userSchema);
