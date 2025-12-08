import { gql } from "@apollo/client";

export const GET_USER_PAYMENT_HISTORY = gql`
  query GET_USER_PAYMENT_HISTORY {
    viewer {
      userData {
        paymentHistory {
          amount
          content
          paymentDate
        }
      }
    }
  }
`;

export type UserPaymentHistory = {
  viewer: {
    userData: {
      paymentHistory?: {
        amount: number,
        content: string,
        paymentDate: string
      }[]
    };
  };
};