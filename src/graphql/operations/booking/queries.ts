export const GET_BOOKING = `
  query GetBooking($id: ID!) {
    booking(id: $id) {
      id
      property {
        id
        title
        images {
          url
        }
        location
        price
      }
      guest {
        id
        name
        email
        image
      }
      checkIn
      checkOut
      totalPrice
      numberOfGuests
      status
      paymentStatus
      createdAt
      updatedAt
    }
  }
`;

export const GET_MY_BOOKINGS = `
  query GetMyBookings {
    myBookings {
      id
      property {
        id
        title
        images {
          url
        }
        location {
          address
          city
          state
          country
          zipCode
        }
        price
      }
      checkIn
      checkOut
      totalPrice
      numberOfGuests
      status
      paymentStatus
      createdAt
    }
  }
`;

export const CHECK_PROPERTY_AVAILABILITY = `
  query CheckAvailability($propertyId: ID!, $checkIn: String!, $checkOut: String!) {
    checkAvailability(propertyId: $propertyId, checkIn: $checkIn, checkOut: $checkOut) {
      available
      message
    }
  }
`;