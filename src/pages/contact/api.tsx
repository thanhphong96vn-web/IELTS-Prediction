import { gql } from "@apollo/client";

export const SEND_EMAIL_MUTATION = gql`
  mutation SEND_EMAIL_MUTATION(
    $input: SendContactEmailInput = {
      email: ""
      message: ""
      name: ""
      subject: ""
    }
  ) {
    sendContactEmail(input: $input) {
      message
      success
    }
  }
`;

export type SendEmailMutationVariables = {
  input: {
    email: string;
    message: string;
    name: string;
    subject: string;
  };
};

export type SendEmailMutationResponse = {
  sendContactEmail: {
    message: string;
    success: boolean;
  };
};
