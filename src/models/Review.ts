import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IReview extends Document {
    rating: number;
    comment?: string;
    property: Types.ObjectId;
    guest: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const reviewSchema = new Schema<IReview>({
    rating: {
        type: Number,
        required: [true, 'Please provide a rating'],
        min: 1,
        max: 5
    },
    comment: {
        type: String,
        trim: true
    },
    property: {
        type: Schema.Types.ObjectId,
        ref: 'Property',
        required: true
    },
    guest: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
});

// Add indexes for faster queries
reviewSchema.index({ property: 1 });
reviewSchema.index({ guest: 1 });

// Prevent duplicate reviews from the same user on the same property
reviewSchema.index({ property: 1, guest: 1 }, { unique: true });

export const Review = mongoose.models.Review || mongoose.model<IReview>('Review', reviewSchema);