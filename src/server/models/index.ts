// Import mongoose to interact with MongoDB
import mongoose from 'mongoose';

// Define the User schema
// This tells MongoDB what fields a User document should have and their types
const userSchema = new mongoose.Schema({
  // User's full name - required field (must be provided)
  name: { 
    type: String, 
    required: true 
  },
  
  // User's email - required and must be unique across all users
  email: { 
    type: String, 
    required: true, 
    unique: true 
  }
}, { 
  // Add automatic timestamp fields (createdAt, updatedAt)
  timestamps: true 
});

// Define the Property schema
const propertySchema = new mongoose.Schema({
  // Basic property information
  title: { 
    type: String, 
    required: true 
  },
  description: { 
    type: String, 
    required: true 
  },
  location: { 
    type: String, 
    required: true 
  },
  
  // Numerical details about the property
  price: { 
    type: Number, 
    required: true,
    min: 0 // Price can't be negative
  },
  bedrooms: { 
    type: Number, 
    required: true,
    min: 1 // Must have at least one bedroom
  },
  bathrooms: { 
    type: Number, 
    required: true,
    min: 1 // Must have at least one bathroom
  },
  maxGuests: { 
    type: Number, 
    required: true,
    min: 1 // Must allow at least one guest
  },
  
  // Arrays of strings for amenities and image URLs
  amenities: [{ 
    type: String 
  }],
  images: [{ 
    type: String 
  }],
  
  // Reference to the User who owns this property
  // This creates a relationship between Property and User collections
  host: { 
    type: mongoose.Schema.Types.ObjectId, // Store the User's ID
    ref: 'User', // Reference the User model
    required: true
  }
}, { 
  timestamps: true 
});

// Define the Booking schema
const bookingSchema = new mongoose.Schema({
  // Reference to the property being booked
  property: { 
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property',
    required: true
  },
  
  // Reference to the user making the booking
  guest: { 
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Booking dates
  checkIn: { 
    type: Date, 
    required: true 
  },
  checkOut: { 
    type: Date, 
    required: true 
  },
  
  // Total price for the stay
  totalPrice: { 
    type: Number, 
    required: true,
    min: 0
  },
  
  // Current status of the booking
  status: { 
    type: String,
    enum: ['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'], // Only these values are allowed
    default: 'PENDING' // New bookings start as PENDING
  }
}, { 
  timestamps: true 
});

// Define the Review schema
const reviewSchema = new mongoose.Schema({
  // Reference to the property being reviewed
  property: { 
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property',
    required: true
  },
  
  // Reference to the user writing the review
  author: { 
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Rating must be between 1 and 5
  rating: { 
    type: Number, 
    required: true,
    min: 1,
    max: 5
  },
  
  // The written review
  comment: { 
    type: String, 
    required: true 
  }
}, { 
  timestamps: true 
});

// Add indexes for better query performance
propertySchema.index({ location: 'text' }); // Enable text search on location
propertySchema.index({ price: 1 }); // Enable sorting and filtering by price
bookingSchema.index({ property: 1, checkIn: 1, checkOut: 1 }); // For checking availability

// Create and export the models
// These will be used throughout the application to interact with the database
export const User = mongoose.model('User', userSchema);
export const Property = mongoose.model('Property', propertySchema);
export const Booking = mongoose.model('Booking', bookingSchema);
export const Review = mongoose.model('Review', reviewSchema);
