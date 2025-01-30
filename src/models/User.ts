import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IUser extends Document {
    name: string;
    email: string;
    password?: string;
    image?: string;
    phoneNumber?: string;
    role: 'GUEST' | 'HOST' | 'ADMIN';
    emailVerified: boolean;
    provider?: string;
    providerId?: string;
    properties?: Types.ObjectId[];
    bookings?: Types.ObjectId[];
    reviews?: Types.ObjectId[];
    createdAt: Date;
    updatedAt: Date;
}

const userSchema = new Schema<IUser>({
    name: {
        type: String,
        required: [true, 'Please provide a name'],
        trim: true
    },
    email: {
        type: String,
        required: [true, 'Please provide an email'],
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: false, // Not required for OAuth users
    },
    image: String,
    phoneNumber: {
        type: String,
        trim: true
    },
    role: {
        type: String,
        enum: ['GUEST', 'HOST', 'ADMIN'],
        default: 'GUEST'
    },
    emailVerified: {
        type: Boolean,
        default: false
    },
    provider: {
        type: String,
        required: false // Only required for OAuth users
    },
    providerId: {
        type: String,
        required: false // Only required for OAuth users
    },
    properties: [{
        type: Schema.Types.ObjectId,
        ref: 'Property'
    }],
    bookings: [{
        type: Schema.Types.ObjectId,
        ref: 'Booking'
    }],
    reviews: [{
        type: Schema.Types.ObjectId,
        ref: 'Review'
    }]
}, {
    timestamps: true
});

// Add indexes for faster queries
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });

export const User = mongoose.models.User || mongoose.model<IUser>('User', userSchema);
