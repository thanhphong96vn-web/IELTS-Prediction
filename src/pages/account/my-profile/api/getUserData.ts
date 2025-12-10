import { gql } from "@apollo/client";

export const GET_USERDATA = gql`
  query GET_USERDATA {
    viewer {
      email
      id
      userData {
        phoneNumber
        dateOfBirth
        gender
        avatar {
          node {
            mediaDetails {
              sizes {
                sourceUrl
                width
              }
            }
            srcSet
          }
        }
        isPro
        proExpirationDate
        # paymentHistory {
        #   amount
        #   content
        #   paymentDate
        # }
      }
      name
    }
  }
`;

export type UserData = {
  viewer: {
    id: string;
    email: string;
    userData: {
      phoneNumber: string;
      avatar?: {
        node: {
          mediaDetails: {
            sizes: Array<{
              sourceUrl: string;
              width: string;
            }>;
          };
          srcSet: string;
        };
      };
      dateOfBirth: string;
      gender: ["male" | "female", string];
      isPro: boolean;
      proExpirationDate?: string;
      // paymentHistory: {
      //   amount: number,
      //   content: string,
      //   paymentDate: string
      // }[]
    };
    name: string;
  };
};