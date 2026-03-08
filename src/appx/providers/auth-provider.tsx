import {
  ApolloClient,
  gql,
  HttpLink,
  InMemoryCache,
  useMutation,
} from "@apollo/client";
import { MasterData, useAppContext } from "@/appx/providers";
import Cookies from "js-cookie";
import { useRouter } from "next/router";
import dayjs, { Dayjs } from "dayjs";
import axios from "axios";
import { useDeviceID } from "@/shared/hooks";
import { useEffect, useState } from "react";
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

  const { masterData } = useAppContext();
  
  // Safe access với default values để tránh lỗi SSR/prerender
  const viewer = masterData?.viewer;

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
    // Luôn đọc credentials mới nhất từ Cookie thay vì dùng masterData (stale SSR data)
    const currentCredentials = getUserCredentials();
    
    if (currentCredentials?.refreshToken) {
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
            refreshToken: currentCredentials.refreshToken,
          },
        });

        if (!data.refreshToken.success) {
          signOut();
          return;
        }

        if (data.refreshToken.authToken) {
          const newUserCredentials = {
            ...currentCredentials,
            authToken: data.refreshToken.authToken,
          };

          // Sử dụng 30 ngày cho cookie expiration thay vì authTokenExpiration (quá ngắn, 5-15 phút)
          Cookies.set("userCredentials", JSON.stringify(newUserCredentials), {
            expires: 30,
            path: "/",
          });

          return data.refreshToken.authToken;
        }
      } catch (error) {
        // Network error - không logout, chỉ log lỗi
        console.error("Refresh token network error:", error);
        return;
      }
    }
    // Chỉ signOut nếu KHÔNG có refreshToken trong cookie (user thực sự chưa login)
    // Không signOut khi network error
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
  // Logic checkDevice đã được chuyển sang DeviceChecker component trong BaseLayout
  // để tránh chạy trùng lặp và chỉ chạy khi user đã login
  return <>{children}</>;
};
