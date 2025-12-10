import { ApolloClient, ApolloLink, from, fromPromise, HttpLink, InMemoryCache } from "@apollo/client";
import { onError } from "@apollo/client/link/error";
import axios from "axios";
import { GetServerSidePropsContext } from "next";

type UserCredentials = {
    authToken: string;
    refreshToken: string;
};

export const createServerApolloClient = (context: GetServerSidePropsContext) => {
    let userCredentials: UserCredentials | null = JSON.parse(
        context.req.cookies.userCredentials || "{}"
    );

    const isSignedIn = Boolean(userCredentials?.authToken);

    const getAuthHeaders = (authToken = userCredentials?.authToken) => {
        return {
            authorization: `Bearer ${authToken}`,
        };
    };

    const errorLink = onError(
        ({ networkError, operation, forward }) => {
            if (networkError) {
                if ('statusCode' in networkError && networkError.statusCode === 403) {
                    return fromPromise(refreshToken()).flatMap((newToken) => {
                        if (newToken) {
                            operation.setContext({
                                headers: {
                                    ...getAuthHeaders(newToken),
                                },
                            });

                            const newUserCredentials = {
                                ...userCredentials,
                                authToken: newToken,
                            };

                            context.res.setHeader(
                                "Set-Cookie",
                                `userCredentials=${JSON.stringify(
                                    newUserCredentials
                                )}; Max-Age=${365 * 24 * 60 * 60}; path=/`
                            );
                        } else {
                            operation.setContext({
                                headers: {},
                            });
                        }

                        return forward(operation);
                    });
                }
            }
        }
    );

    const link = new HttpLink({
        uri: process.env.NEXT_PUBLIC_WORDPRESS_CMS_URL + "/graphql",
    });

    const authLink = new ApolloLink((operation, forward) => {
        if (operation.getContext().authRequired) {
            operation.setContext({
                headers: {
                    ...getAuthHeaders(),
                },
            });
        }
        return forward(operation);
    });

    const client = new ApolloClient({
        link: from([authLink, errorLink, link]),
        cache: new InMemoryCache(),
    });

    const refreshToken = async () => {
        if (userCredentials?.refreshToken && isSignedIn) {
            try {
                const {
                    data: { data },
                } = await axios.post<{
                    data: {
                        refreshToken: {
                            authToken: string;
                            authTokenExpiration: number;
                            success: boolean;
                        };
                    };
                }>(process.env.NEXT_PUBLIC_WORDPRESS_CMS_URL + "/graphql", {
                    query: `mutation refreshToken(
  $refreshToken: String!
) {
  refreshToken( input: {refreshToken: $refreshToken} ) {
    authToken # The new auth token for the user.
    authTokenExpiration # The expiration time of the new auth token.
    success
  }
}`,
                    variables: {
                        refreshToken: userCredentials.refreshToken,
                    },
                });

                if (!data.refreshToken.success) {
                    throw new Error("Refresh token failed");
                }

                if (data.refreshToken.authToken) {
                    return data.refreshToken.authToken;
                }
            } catch (error) {
                console.log(error);
                userCredentials = null;
                context.res.setHeader("Set-Cookie", [
                    "userCredentials=; Max-Age=0; path=/",
                ]);
            }
        } else {
            userCredentials = null;
            context.res.setHeader("Set-Cookie", [
                "userCredentials=; Max-Age=0; path=/",
            ]);
        }
    };

    return {
        client,
        isSignedIn,
        getAuthHeaders,
        refreshToken,
        userCredentials,
    };
}