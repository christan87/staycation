import mongoose, { Document, Model, Schema } from 'mongoose';
import { IProperty } from './Property';
import { User } from './User';

// Interface for type safety
export interface IBooking extends Document {
    _id: mongoose.Types.ObjectId;
    property: mongoose.Types.ObjectId | IProperty;  // Allow populated property
    guest: mongoose.Types.ObjectId | InstanceType<typeof User>;  // Allow populated guest
    checkIn: Date;
    checkOut: Date;
    totalPrice: number;
    numberOfGuests: number;
    status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
    paymentStatus: 'pending' | 'paid' | 'refunded';
    createdAt: Date;
    updatedAt: Date;
}

// Static methods interface
export interface IBookingModel extends Model<IBooking> {
    checkAvailability(propertyId: mongoose.Types.ObjectId | string, checkIn: Date, checkOut: Date): Promise<boolean>;
}

const bookingSchema = new Schema<IBooking>({
    property: {
        type: Schema.Types.ObjectId,
        ref: 'Property',
        required: [true, 'Property is required'],
        index: true
    },
    guest: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Guest is required'],
        index: true
    },
    checkIn: {
        type: Date,
        required: [true, 'Check-in date is required'],
        validate: {
            validator: function(this: IBooking, checkIn: Date) {
                return checkIn >= new Date();
            },
            message: 'Check-in date must be in the future'
        }
    },
    checkOut: {
        type: Date,
        required: [true, 'Check-out date is required'],
        validate: {
            validator: function(this: IBooking, checkOut: Date) {
                return !this.checkIn || checkOut > this.checkIn;
            },
            message: 'Check-out date must be after check-in date'
        }
    },
    totalPrice: {
        type: Number,
        required: [true, 'Total price is required']
    },
    numberOfGuests: {
        type: Number,
        required: [true, 'Number of guests is required'],
        min: [1, 'Must have at least 1 guest']
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'cancelled', 'completed'],
        default: 'pending',
        lowercase: true
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'paid', 'refunded'],
        default: 'pending',
        lowercase: true
    }
}, {
    timestamps: true
});

// Add checkAvailability as a static method
bookingSchema.statics.checkAvailability = async function(
    propertyId: mongoose.Types.ObjectId | string,
    checkIn: Date,
    checkOut: Date
): Promise<boolean> {
    const propertyObjectId = typeof propertyId === 'string' ? new mongoose.Types.ObjectId(propertyId) : propertyId;
    
    const overlappingBookings = await this.find({
        property: propertyObjectId,
        status: { $nin: ['cancelled'] },
        $or: [
            {
                checkIn: { $lt: checkOut },
                checkOut: { $gt: checkIn }
            },
            {
                checkIn: { $gte: checkIn, $lt: checkOut }
            },
            {
                checkOut: { $gt: checkIn, $lte: checkOut }
            }
        ]
    });

    return overlappingBookings.length === 0;
};

// Middleware to validate number of guests against property capacity
bookingSchema.pre('save', async function(next) {
    if (this.isModified('numberOfGuests') || this.isNew) {
        const property = await mongoose.model('Property').findById(this.property);
        if (!property) {
            throw new Error('Property not found');
        }
        if (this.numberOfGuests > property.maxGuests) {
            throw new Error(`Number of guests cannot exceed property capacity of ${property.maxGuests}`);
        }
    }
    next();
});

// Create and export the model
export const BookingModel: IBookingModel = (mongoose.models.Booking || mongoose.model<IBooking, IBookingModel>('Booking', bookingSchema)) as IBookingModel;