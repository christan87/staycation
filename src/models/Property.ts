import mongoose, { Schema, Document, Types } from "mongoose";

// Interface for type safety
export interface IProperty extends Document {
    title: string;
    description: string;
    location: {
        address: string;
        city: string;
        state: string;
        country: string;
        zipCode: string;
        coordinates?: {
            latitude: number;
            longitude: number;
        };
    };
    price: number;
    images: Array<{
        url: string;
        publicId: string;
    }>;
    amenities: string[];
    host: Types.ObjectId;
    maxGuests: number;
    type: 'HOUSE' | 'APARTMENT' | 'VILLA' | 'CABIN' | 'COTTAGE';
    rating?: number;
    reviews?: Types.ObjectId[];
    createdAt: Date;
    updatedAt: Date;
}

const propertySchema = new Schema<IProperty>({
    title: {
        type: String,
        required: [true, 'Please provide a title'],
        trim: true,
        maxLength: [100, 'Title cannot be more than 100 characters']
    },
    description: {
        type: String,
        required: [true, 'Please provide a description'],
        trim: true
    },
    location: {
        address: {
            type: String,
            required: [true, 'Please provide an address']
        },
        city: {
            type: String,
            required: [true, 'Please provide a city']
        },
        state: {
            type: String,
            required: [true, 'Please provide a state']
        },
        country: {
            type: String,
            required: [true, 'Please provide a country']
        },
        zipCode: {
            type: String,
            required: [true, 'Please provide a zip code']
        },
        coordinates: {
            latitude: Number,
            longitude: Number
        }
    },
    price: {
        type: Number,
        required: [true, 'Please provide a price'],
        min: [0, 'Price cannot be negative']
    },
    images: [{
        url: {
            type: String,
            required: true
        },
        publicId: {
            type: String,
            required: true
        }
    }],
    amenities: [{
        type: String,
        required: true
    }],
    maxGuests: {
        type: Number,
        required: [true, 'Please specify maximum number of guests']
    },
    type: {
        type: String,
        enum: ['HOUSE', 'APARTMENT', 'VILLA', 'CABIN', 'COTTAGE'],
        required: [true, 'Please specify property type']
    },
    host: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    rating: {
        type: Number,
        min: 0,
        max: 5,
        default: null
    },
    reviews: [{
        type: Schema.Types.ObjectId,
        ref: 'Review'
    }]
}, {
    timestamps: true
});

// Add indexes for faster queries
propertySchema.index({ 'location.city': 1, price: 1 });
propertySchema.index({ 'location.state': 1, price: 1 });
propertySchema.index({ 'location.country': 1, price: 1 });
propertySchema.index({ type: 1 });
propertySchema.index({ host: 1 });

// Export the model with existence check
export const Property = mongoose.models.Property || mongoose.model<IProperty>('Property', propertySchema);
