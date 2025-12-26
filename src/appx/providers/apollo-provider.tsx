import {
  ApolloClient,
  ApolloLink,
  from,
  fromPromise,
  InMemoryCache,
  ApolloProvider as Provider,
} from "@apollo/client";
import { onError } from "@apollo/client/link/error";
import { useAuth } from "./auth-provider";
import createUploadLink from "apollo-upload-client/createUploadLink.mjs";

export const ApolloProvider = ({ children }: { children: React.ReactNode }) => {
  const { getAuthHeaders, refreshToken, isSignedIn } = useAuth();

  const errorLink = onError(
    ({ graphQLErrors, networkError, operation, forward }) => {
      const is403 = Boolean(
        graphQLErrors?.some(({ message }) => message === "Invalid token") ||
        (networkError as unknown as { statusCode: number })?.statusCode ===
        403
      );

      const isTokenExpired = is403;

      if (isTokenExpired) {
        return fromPromise(refreshToken()).flatMap((newToken) => {
          if (newToken) {
            operation.setContext({
              headers: {
                ...getAuthHeaders(newToken),
              },
            });
          } else {
            operation.setContext({
              headers: {},
            });
          }

          return forward(operation);
        });
      } else {
        console.debug(graphQLErrors, networkError);
      }
    }
  );

  const authLink = new ApolloLink((operation, forward) => {
    if (operation.getContext().authRequired && isSignedIn) {
      operation.setContext({
        headers: {
          ...getAuthHeaders(),
        },
      });
    }
    return forward(operation);
  });

  const link = createUploadLink({
    uri: process.env.NEXT_PUBLIC_WORDPRESS_CMS_URL + "/graphql",
  });

  const client = new ApolloClient({
    link: from([authLink, errorLink, link as unknown as ApolloLink]),
    cache: new InMemoryCache(),
  });
  return <Provider client={client}>{children}</Provider>;
};
