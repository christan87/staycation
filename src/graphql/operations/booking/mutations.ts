export const CREATE_BOOKING = `
  mutation CreateBooking($input: CreateBookingInput!) {
    createBooking(input: $input) {
      success
      message
      booking {
        id
        property {
          id
          title
          images {
            url
          }
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
  }
`;

export const UPDATE_BOOKING = `
  mutation UpdateBooking($input: UpdateBookingInput!) {
    updateBooking(input: $input) {
      success
      message
      booking {
        id
        checkIn
        checkOut
        numberOfGuests
        status
        paymentStatus
        updatedAt
      }
    }
  }
`;

export const CANCEL_BOOKING = `
  mutation CancelBooking($bookingId: ID!) {
    cancelBooking(bookingId: $bookingId) {
      success
      message
      booking {
        id
        status
        paymentStatus
        updatedAt
      }
    }
  }
`;

export const CONFIRM_BOOKING = `
  mutation ConfirmBooking($bookingId: ID!) {
    confirmBooking(bookingId: $bookingId) {
      success
      message
      booking {
        id
        status
        paymentStatus
        updatedAt
      }
    }
  }
`;

export const DELETE_BOOKING = `
  mutation DeleteBooking($bookingId: ID!) {
    deleteBooking(bookingId: $bookingId) {
      success
      message
    }
  }
`;