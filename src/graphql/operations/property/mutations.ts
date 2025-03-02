import { gql } from '@apollo/client';

// Apollo Client gql template literals

export const CREATE_PROPERTY = gql`
  mutation CreateProperty($input: CreatePropertyInput!) {
    createProperty(input: $input) {
      id
      title
      description
      location {
        address
        city
        state
        country
        zipCode
        coordinates {
          latitude
          longitude
        }
      }
      price
      images {
        url
        publicId
      }
      amenities
      host {
        id
        name
        email
        image
      }
      maxGuests
      type
      rating
      petFriendly
      allowsCats
      allowsDogs
      createdAt
      updatedAt
      reviews {
        id
        rating
        comment
        guest {
          id
          name
          image
        }
        createdAt
        updatedAt
      }
    }
  }
`;

export const UPDATE_PROPERTY = gql`
  mutation UpdateProperty($input: UpdatePropertyInput!) {
    updateProperty(input: $input) {
      id
      title
      description
      location {
        address
        city
        state
        country
        zipCode
        coordinates {
          latitude
          longitude
        }
      }
      price
      images {
        url
        publicId
      }
      amenities
      maxGuests
      type
      rating
      petFriendly
      allowsCats
      allowsDogs
      updatedAt
    }
  }
`;

export const DELETE_PROPERTY = gql`
  mutation DeleteProperty($id: ID!) {
    deleteProperty(id: $id)
  }
`;

export const BECOME_HOST = gql`
  mutation BecomeHost {
    becomeHost {
      success
      message
      user {
        id
        role
      }
    }
  }
`;