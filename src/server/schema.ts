// This is our GraphQL schema definition using the GraphQL Schema Definition Language (SDL)
export const typeDefs = `#graphql
  # User type represents a user in the system
  type User {
    id: ID!
    name: String!
    email: String!
    image: String
    role: UserRole!
    emailVerified: String
    properties: [Property!]!
    bookings: [Booking!]!
    reviews: [Review!]!
    createdAt: String!
    updatedAt: String!
  }

  # Auth response type for login/register
  type AuthResponse {
    user: User!
    token: String!
  }

  # Input type for user registration
  input RegisterInput {
    name: String!
    email: String!
    password: String!
  }

  # Input type for user login
  input LoginInput {
    email: String!
    password: String!
  }

  # Property type represents a vacation rental property
  type Property {
    id: ID!
    title: String!
    description: String!
    location: String!
    price: Float!
    bedrooms: Int!
    bathrooms: Int!
    maxGuests: Int!
    amenities: [String!]!
    images: [String!]!
    host: User!
    bookings: [Booking!]!
    reviews: [Review!]!
    createdAt: String!
    updatedAt: String!
  }

  # Booking type represents a reservation
  type Booking {
    id: ID!
    property: Property!
    guest: User!
    checkIn: String!
    checkOut: String!
    guestCount: Int!
    totalPrice: Float!
    status: BookingStatus!
    createdAt: String!
    updatedAt: String!
  }

  # Review type represents a review for a property
  type Review {
    id: ID!
    property: Property!
    author: User!
    rating: Int!
    comment: String!
    createdAt: String!
    updatedAt: String!
  }

  # Enum for booking status
  enum BookingStatus {
    PENDING
    CONFIRMED
    CANCELLED
    COMPLETED
  }

  # Enum for user roles
  enum UserRole {
    USER
    HOST
    ADMIN
  }

  # Input types for mutations
  input PropertyInput {
    title: String!
    description: String!
    location: String!
    price: Float!
    bedrooms: Int!
    bathrooms: Int!
    maxGuests: Int!
    amenities: [String!]!
    images: [String!]!
  }

  input BookingInput {
    checkIn: String!
    checkOut: String!
    guestCount: Int!
  }

  input ReviewInput {
    rating: Int!
    comment: String!
  }

  type Query {
    # Auth queries
    me: User                           # Get current authenticated user
    user(id: ID!): User               # Get user by ID (admin only)
    users: [User!]!                   # Get all users (admin only)

    # Property queries
    property(id: ID!): Property
    properties(
      location: String
      minPrice: Float
      maxPrice: Float
      bedrooms: Int
      maxGuests: Int
    ): [Property!]!

    # Booking queries
    booking(id: ID!): Booking
    myBookings: [Booking!]!
    propertyBookings(propertyId: ID!): [Booking!]!

    # Review queries
    review(id: ID!): Review
    propertyReviews(propertyId: ID!): [Review!]!
  }

  type Mutation {
    # Auth mutations
    register(input: RegisterInput!): AuthResponse!
    login(input: LoginInput!): AuthResponse!
    updateProfile(
      name: String
      password: String
    ): User!

    # Property mutations
    createProperty(input: PropertyInput!): Property!
    updateProperty(id: ID!, input: PropertyInput!): Property!
    deleteProperty(id: ID!): Boolean!

    # Booking mutations
    createBooking(propertyId: ID!, input: BookingInput!): Booking!
    updateBookingStatus(id: ID!, status: BookingStatus!): Booking!

    # Review mutations
    createReview(propertyId: ID!, input: ReviewInput!): Review!
  }
`;
