import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser {
  name: string;
  email: string;
  password?: string;
  image?: string;
  emailVerified?: Date;
  provider?: string;
  role: 'USER' | 'HOST' | 'ADMIN';
  createdAt: Date;
  updatedAt: Date;
}

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

// Hash password before saving
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

// Add method to check password
userSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    return false;
  }
};

// Add method to check if user can host properties
userSchema.methods.canHost = function(): boolean {
  return this.role === 'HOST' || this.role === 'ADMIN';
};

export const User = mongoose.models.User || mongoose.model<IUser>('User', userSchema);
