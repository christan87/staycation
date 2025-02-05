export const GET_PROPERTIES = `
  query GetProperties($limit: Int, $offset: Int, $filter: PropertyFilterInput) {
    properties(limit: $limit, offset: $offset, filter: $filter) {
      id
      title
      description
      price
      images {
        url
        publicId
      }
      location {
        city
        country
      }
      host {
        id
        name
      }
      maxGuests
      type
      rating
    }
  }
`;

export const GET_PROPERTY = `
  query GetProperty($id: ID!) {
    property(id: $id) {
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
      }
      maxGuests
      type
      rating
      petFriendly
      allowsCats
      allowsDogs
      createdAt
      updatedAt
    }
  }
`;

export const GET_MY_PROPERTIES = `
  query GetMyProperties {
    myProperties {
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
    }
  }
`;