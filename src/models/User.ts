import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name'],
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
  },
  password: {
    type: String,
    required: false, // Not required for OAuth users
  },
  image: String,
  emailVerified: {
    type: Boolean,
    default: false,
  },
  provider: {
    type: String,
    required: false, // Only required for OAuth users
  },
  providerId: {
    type: String,
    required: false, // Only required for OAuth users
  },
  role: {
    type: String,
    enum: ['USER', 'ADMIN'],
    default: 'USER',
  },
}, {
  timestamps: true,
});

export const User = mongoose.models.User || mongoose.model('User', userSchema);
