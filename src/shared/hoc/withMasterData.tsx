import { gql } from "@apollo/client";
import { MasterData } from "@/appx/providers";
import { GetServerSidePropsContext } from "next";
import { createServerApolloClient } from "../graphql";

const GET_MASTER_DATA = gql`
  query GET_MASTER_DATA {
    websiteOptions {
      websiteOptionsFields {
        generalSettings {
          favicon {
            node {
              sourceUrl
            }
          }
          logo {
            node {
              sourceUrl
            }
          }
          facebook
          email
          zalo
          phoneNumber
          preventCopy
          buyProLink
          bannerTestResult {
            node {
              sourceUrl
            }
          }
        }
      }
    }
    allSettings {
      generalSettingsTitle
    }
    viewer {
      name
      id
      roles {
        nodes {
          name
        }
      }
      userData {
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
      }
    }
    menuData
  }
`;

export async function withMasterData(context: GetServerSidePropsContext) {
  const { client, isSignedIn, getAuthHeaders, userCredentials } =
    createServerApolloClient(context);
  const promiseArr = [];

  promiseArr.push(
    client.query<MasterData>({
      query: GET_MASTER_DATA,
      context: { headers: isSignedIn ? getAuthHeaders() : {} },
    })
  );

  const [masterDataResponse] = await Promise.all(promiseArr);

  const data = masterDataResponse.data;

  if (!data)
    return {
      props: {},
    };

  return {
    props: {
      masterData: {
        ...data,
        ...(isSignedIn && { userCredentials }),
      },
    },
  };
}
