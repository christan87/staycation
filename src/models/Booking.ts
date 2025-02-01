import mongoose, { Schema, Document, Types, Model } from "mongoose";
import { IProperty } from "./Property";
import { User } from "./User";

// Interface for type safety
export interface IBooking extends Document {
    property: Types.ObjectId | IProperty;  // Allow populated property
    guest: Types.ObjectId | InstanceType<typeof User>;  // Allow populated guest
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
    checkAvailability(propertyId: Types.ObjectId, checkIn: Date, checkOut: Date): Promise<boolean>;
}

const bookingSchema = new Schema<IBooking>({
    property: {
        type: Schema.Types.ObjectId,
        ref: 'Property',
        required: [true, 'Property is required'],
        index: true  // Index for faster lookups
    },
    guest: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Guest is required'],
        index: true  // Index for faster lookups
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
                return checkOut > this.checkIn;
            },
            message: 'Check-out date must be after check-in date'
        }
    },
    totalPrice: {
        type: Number,
        required: [true, 'Total price is required'],
        min: [0, 'Total price cannot be negative']
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
        required: true
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'paid', 'refunded'],
        default: 'pending',
        required: true
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },  // Enable virtuals when converting to JSON
    toObject: { virtuals: true } // Enable virtuals when converting to object
});

// Add compound indexes for faster queries and ensuring data integrity
bookingSchema.index({ property: 1, checkIn: 1, checkOut: 1 });
bookingSchema.index({ guest: 1, status: 1 });
bookingSchema.index({ property: 1, guest: 1, status: 1 });

// Middleware to ensure property exists before saving
bookingSchema.pre('save', async function(next) {
    if (this.isNew || this.isModified('property')) {
        const property = await mongoose.model('Property').findById(this.property);
        if (!property) {
            throw new Error('Property does not exist');
        }
    }
    next();
});

// Middleware to ensure guest exists before saving
bookingSchema.pre('save', async function(next) {
    if (this.isNew || this.isModified('guest')) {
        const guest = await mongoose.model('User').findById(this.guest);
        if (!guest) {
            throw new Error('Guest does not exist');
        }
    }
    next();
});

// Method to check booking availability
bookingSchema.statics.checkAvailability = async function(
    propertyId: Types.ObjectId,
    checkIn: Date,
    checkOut: Date
): Promise<boolean> {
    const overlappingBookings = await this.find({
        property: propertyId,
        status: { $nin: ['cancelled'] },  // Exclude cancelled bookings
        $or: [
            { 
                checkIn: { $lte: checkOut },
                checkOut: { $gte: checkIn }
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
        if (this.numberOfGuests > property.guests) {
            throw new Error(`Number of guests cannot exceed property capacity of ${property.guests}`);
        }
    }
    next();
});

// Virtual populate for property
bookingSchema.virtual('propertyDetails', {
    ref: 'Property',
    localField: 'property',
    foreignField: '_id',
    justOne: true
});

// Virtual populate for guest
bookingSchema.virtual('guestDetails', {
    ref: 'User',
    localField: 'guest',
    foreignField: '_id',
    justOne: true
});

// Export the Booking model with a check to prevent overwriting
export const Booking = mongoose.models.Booking || mongoose.model<IBooking, IBookingModel>('Booking', bookingSchema);