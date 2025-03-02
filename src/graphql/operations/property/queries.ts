import { gql } from '@apollo/client';

export const GET_PROPERTIES = gql`
  query GetProperties($limit: Int, $offset: Int, $filter: PropertyFilterInput) {
    properties(limit: $limit, offset: $offset, filter: $filter) {
      items {
        id
        title
        description
        price
        images {
          url
          publicId
        }
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
        host {
          id
          name
        }
        maxGuests
        type
        rating
      }
      pageInfo {
        totalCount
        hasNextPage
        hasPreviousPage
      }
    }
  }
`;

export const GET_PROPERTY = gql`
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

// Raw string version of the GET_PROPERTY query for use with direct fetch calls
export const GET_PROPERTY_STRING = `
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

export const GET_MY_PROPERTIES = gql`
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

export const SEARCH_PROPERTIES = gql`
  query SearchProperties($query: String!, $limit: Int, $offset: Int) {
    searchProperties(query: $query, limit: $limit, offset: $offset) {
      items {
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
      pageInfo {
        totalCount
        hasNextPage
        hasPreviousPage
      }
    }
  }
`;