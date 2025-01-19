// This is our GraphQL schema definition using the GraphQL Schema Definition Language (SDL)
export const typeDefs = `#graphql
  # Property type represents a vacation rental property
  type Property {
    id: ID!                    # Unique identifier for the property (! means required)
    title: String!             # Name/title of the property
    description: String!       # Detailed description
    location: String!          # Property location (e.g., city, address)
    price: Float!             # Price per night
    bedrooms: Int!            # Number of bedrooms
    bathrooms: Int!           # Number of bathrooms
    maxGuests: Int!           # Maximum number of guests allowed
    amenities: [String!]!     # List of amenities (e.g., ["WiFi", "Pool"])
    images: [String!]!        # List of image URLs
    host: User!               # Reference to the User who owns this property
    bookings: [Booking!]!     # List of bookings for this property
    reviews: [Review!]!       # List of reviews for this property
    createdAt: String!        # Timestamp when property was created
    updatedAt: String!        # Timestamp when property was last updated
  }

  # User type represents a user in the system (can be either host or guest)
  type User {
    id: ID!                   # Unique identifier for the user
    name: String!             # User's full name
    email: String!            # User's email address
    properties: [Property!]!  # List of properties owned by this user (if they're a host)
    bookings: [Booking!]!     # List of bookings made by this user (if they're a guest)
    reviews: [Review!]!       # List of reviews written by this user
  }

  # Booking type represents a reservation of a property
  type Booking {
    id: ID!                   # Unique identifier for the booking
    property: Property!       # Reference to the booked property
    guest: User!             # Reference to the user who made the booking
    checkIn: String!         # Check-in date
    checkOut: String!        # Check-out date
    guestCount: Int!         # Number of guests for this booking
    totalPrice: Float!       # Total price for the stay
    status: BookingStatus!   # Current status of the booking
    createdAt: String!       # When the booking was created
    updatedAt: String!       # When the booking was last updated
  }

  # Review type represents a review left by a guest for a property
  type Review {
    id: ID!                  # Unique identifier for the review
    property: Property!      # Reference to the reviewed property
    author: User!           # Reference to the user who wrote the review
    rating: Int!            # Rating score (typically 1-5)
    comment: String!        # Review text content
    createdAt: String!      # When the review was created
  }

  # Enum for possible booking statuses
  enum BookingStatus {
    PENDING                 # Booking is awaiting confirmation
    CONFIRMED              # Booking has been confirmed by the host
    CANCELLED              # Booking has been cancelled
    COMPLETED              # Stay has been completed
  }

  # Input type for creating/updating a property
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

  # Input type for creating a booking
  input BookingInput {
    checkIn: String!        # Check-in date
    checkOut: String!       # Check-out date
    guestCount: Int!        # Number of guests
  }

  # Input type for creating a review
  input ReviewInput {
    rating: Int!           # Rating score
    comment: String!       # Review text
  }

  # Query type defines all the ways to read data
  type Query {
    # Get all properties with optional filters
    properties(
      location: String     # Filter by location
      minPrice: Float     # Filter by minimum price
      maxPrice: Float     # Filter by maximum price
      bedrooms: Int       # Filter by minimum number of bedrooms
      maxGuests: Int      # Filter by maximum number of guests
    ): [Property!]!

    # Get a single property by ID
    property(id: ID!): Property

    # Get a single user by ID
    user(id: ID!): User

    # Get all bookings for a specific user
    bookings(userId: ID!): [Booking!]!
  }

  # Mutation type defines all the ways to create/update/delete data
  type Mutation {
    # Create a new property
    createProperty(input: PropertyInput!): Property!

    # Update an existing property
    updateProperty(id: ID!, input: PropertyInput!): Property!

    # Delete a property
    deleteProperty(id: ID!): Boolean!

    # Create a new booking
    createBooking(propertyId: ID!, input: BookingInput!): Booking!

    # Update a booking's status
    updateBookingStatus(id: ID!, status: BookingStatus!): Booking!

    # Create a new review
    createReview(propertyId: ID!, input: ReviewInput!): Review!
  }
`;
