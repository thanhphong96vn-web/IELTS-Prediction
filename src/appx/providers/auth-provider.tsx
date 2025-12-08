import {
  ApolloClient,
  gql,
  HttpLink,
  InMemoryCache,
  useLazyQuery,
  useMutation,
} from "@apollo/client";
import { MasterData, useAppContext } from "@/appx/providers";
import Cookies from "js-cookie";
import { useRouter } from "next/router";
import dayjs, { Dayjs } from "dayjs";
import axios from "axios";
import { useDeviceID } from "@/shared/hooks";
import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { ROUTES } from "@/shared/routes";
// import { useEffect, useState } from "react";
// import FingerprintJS from "@fingerprintjs/fingerprintjs";

const LOGIN_MUTATION = gql`
  mutation login(
    $username: String!
    $password: String!
    $provider: LoginProviderEnum! = PASSWORD
    $deviceId: String!
    $deviceType: String!
  ) {
    login(
      input: {
        provider: $provider # This tells the mutation to use the WordPress username/password authentication method.
        credentials: {
          # This is the input required for the PASSWORD provider.
          username: $username
          password: $password
        }
        deviceId: $deviceId
        deviceType: $deviceType
      }
    ) {
      authToken
      authTokenExpiration
      refreshToken
      refreshTokenExpiration
    }
  }
`;

const GOOGLE_LOGIN_MUTATION = gql`
  mutation login($code: String!, $deviceId: String!, $deviceType: String!) {
    login(
      input: {
        provider: GOOGLE
        oauthResponse: { code: $code }
        deviceId: $deviceId
        deviceType: $deviceType
      }
    ) {
      authToken
      authTokenExpiration
      refreshToken
      refreshTokenExpiration
    }
  }
`;

// const REFRESH_TOKEN_MUTATION = gql`
//   mutation RefreshToken($refreshToken: String!) {
//     refreshJwtAuthToken(input: { jwtRefreshToken: $refreshToken }) {
//       authToken
//     }
//   }
// `;

type RegisterMutationResponse = {
  errors?: Array<{
    message: string;
    locations: Array<{
      line: number;
      column: number;
    }>;
    path: Array<string>;
  }>;
  data: {
    registerUser?: {
      clientMutationId: string;
    };
  };
};

export const useAuth = () => {
  const getDeviceID = useDeviceID((state) => state.getDeviceID);
  const getDeviceType = useDeviceID((state) => state.getDeviceType);
  const router = useRouter();
  const [deviceId, setDeviceId] = useState<string>("");

  useEffect(() => {
    const getDeviceId = async () => {
      const deviceId = await getDeviceID();
      setDeviceId(deviceId);
    };

    getDeviceId();
  }, [getDeviceID]);

  const link = new HttpLink({
    uri: process.env.NEXT_PUBLIC_WORDPRESS_CMS_URL + "/graphql",
  });

  const client = new ApolloClient({
    link,
    cache: new InMemoryCache(),
  });

  const [loginMutation] = useMutation<{
    login: {
      authToken: string;
      refreshToken: string;
      refreshTokenExpiration: number;
      authTokenExpiration: number;
    };
  }>(LOGIN_MUTATION, {
    client,
    variables: {
      deviceId: deviceId,
      deviceType: getDeviceType(),
    },
  });

  const {
    masterData: { viewer, userCredentials },
  } = useAppContext();

  const isSignedIn = Boolean(viewer);

  const [googleLoginMutation] = useMutation<{
    login: {
      authToken: string;
      refreshToken: string;
      refreshTokenExpiration: number;
      authTokenExpiration: number;
    };
  }>(GOOGLE_LOGIN_MUTATION, {
    client,
    variables: {
      deviceId: deviceId,
      deviceType: getDeviceType(),
    },
  });

  const signIn = async ({
    username,
    password,
    provider = "PASSWORD",
    args,
  }: {
    username?: string;
    password?: string;
    provider?: "PASSWORD" | "GOOGLE";
    args?: Partial<{ code: string }>;
  }) => {
    const result =
      provider === "GOOGLE"
        ? await googleLoginMutation({
            variables: {
              code: args?.code,
            },
          })
        : await loginMutation({
            variables: {
              password,
              username,
            },
          });

    if (result.data) {
      const credentials = {
        authToken: result.data.login.authToken,
        refreshToken: result.data.login.refreshToken,
      };

      Cookies.set("userCredentials", JSON.stringify(credentials), {
        expires: dayjs.unix(result.data.login.refreshTokenExpiration).toDate(),
        path: "/",
      });

      return credentials;
    } else {
      return null;
    }
  };

  const signUp = async ({
    name,
    email,
    password,
    date_of_birth,
    gender,
    avatar,
  }: {
    name: string;
    email: string;
    password: string;
    date_of_birth: Dayjs;
    gender: "male" | "female";
    avatar: File | null;
  }) => {
    const dateOfBirth = date_of_birth.format("DD/MM/YYYY");

    const formData = new FormData();
    formData.append(
      "operations",
      `{"query": "mutation ($email: String!, $avatar: Upload, $dateOfBirth: String!, $displayName: String!, $gender: String!, $password: String!, $username: String!) { registerUser(input: {username: $username, email: $email, displayName: $displayName, password: $password, dateOfBirth: $dateOfBirth, avatar: $avatar, gender: $gender, nickname: $displayName}) { clientMutationId } }", "variables": {"avatar": null, "dateOfBirth": "${dateOfBirth}", "displayName": "${name}", "email": "${email}", "gender": "${gender}", "password": "${password}", "username": "${email}"}}`
    );
    if (avatar) {
      formData.append("map", '{ "0": ["variables.avatar"] }');
      formData.append("0", avatar);
    } else {
      formData.append("map", "{}");
    }

    const { data } = await axios.post<RegisterMutationResponse>(
      `${process.env.NEXT_PUBLIC_WORDPRESS_CMS_URL}/graphql`,
      formData
    );

    return data;
  };

  const signOut = () => {
    Cookies.remove("userCredentials");
    router.push(ROUTES.LOGIN(router.asPath));
  };

  const getAuthHeaders = (authToken = getUserCredentials()?.authToken) => {
    // console.log(authToken);
    return {
      Authorization: `Bearer ${authToken}`,
    };
  };

  const refreshToken = async () => {
    if (userCredentials?.refreshToken) {
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
        signOut();
      }

      if (data.refreshToken.authToken) {
        const newUserCredentials = {
          ...userCredentials,
          authToken: data.refreshToken.authToken,
        };

        Cookies.set("userCredentials", JSON.stringify(newUserCredentials), {
          expires: dayjs.unix(data.refreshToken.authTokenExpiration).toDate(),
          path: "/",
        });

        return data.refreshToken.authToken;
      }
    } else {
      signOut();
    }
  };

  const getUserCredentials = (): MasterData["userCredentials"] | null => {
    return JSON.parse(Cookies.get("userCredentials") || "{}");
  };

  return {
    isSignedIn,
    currentUser: viewer,
    signIn,
    signOut,
    refreshToken,
    signUp,
    getAuthHeaders,
  };
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const { signOut } = useAuth();
  const getDeviceID = useDeviceID((state) => state.getDeviceID);
  const getDeviceType = useDeviceID((state) => state.getDeviceType);
  const [deviceId, setDeviceId] = useState<string>("");

  const [checkMutation, { data }] = useLazyQuery(
    gql`
      query CHECK($deviceId: String!, $deviceType: String!) {
        checkDevice(deviceId: $deviceId, deviceType: $deviceType)
      }
    `,
    {
      variables: {
        deviceId,
        deviceType: getDeviceType(),
      },
      context: {
        authRequired: true,
      },
      fetchPolicy: "no-cache",
    }
  );

  useEffect(() => {
    getDeviceID().then((id) => {
      setDeviceId(id);
    });
  }, [getDeviceID]);

  const checkBlur = useCallback(() => {
    if (deviceId === "") return;
    checkMutation();
  }, [checkMutation, deviceId]);

  useEffect(() => {
    window.addEventListener("blur", checkBlur);
    window.addEventListener("focus", checkBlur);
    return () => {
      window.removeEventListener("blur", checkBlur);
      window.removeEventListener("focus", checkBlur);
    };
  }, [checkBlur]);

  useEffect(() => {
    if (deviceId === "") return;
    checkMutation();
  }, [checkMutation, deviceId]);

  useEffect(() => {
    if (!data) return;
    if (!data.checkDevice) {
      toast.error(
        "Your account has been logged in from another device, you will be logged out."
      );
      signOut();
    }
  }, [data, signOut]);

  return <>{children}</>;
};
