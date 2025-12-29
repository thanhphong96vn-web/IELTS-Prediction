import { gql } from "@apollo/client";

export const UPDATE_USER = gql`
mutation (
  $id: ID!
  $dateOfBirth: String = null
  $email: String = null
  $gender: String = null
  $name: String = null
  $password: String = null
  $avatar: Upload = null
  $phoneNumber: String = null
) {
  updateUser(
    input: {
      id: $id
      dateOfBirth: $dateOfBirth
      email: $email
      userLogin: $email
      gender: $gender
      displayName: $name
      nickname: $name
      password: $password
      avatar: $avatar
      phoneNumber: $phoneNumber
    }
  ) {
    clientMutationId
  }
}
`;