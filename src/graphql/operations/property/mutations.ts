export const CREATE_PROPERTY = `
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
      }
      maxGuests
      type
      rating
      createdAt
      updatedAt
      reviews {
        id
        rating
        comment
        createdAt
        updatedAt
      }
    }
  }
`;

export const UPDATE_PROPERTY = `
  mutation UpdateProperty($input: UpdatePropertyInput!) {
    updateProperty(input: $input) {
      id
      title
      description
      price
    }
  }
`;

export const DELETE_PROPERTY = `
  mutation DeleteProperty($id: ID!) {
    deleteProperty(id: $id)
  }
`;