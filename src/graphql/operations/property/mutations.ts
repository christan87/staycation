export const CREATE_PROPERTY = `
  mutation CreateProperty($input: CreatePropertyInput!) {
    createProperty(input: $input) {
      id
      title
      description
      price
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