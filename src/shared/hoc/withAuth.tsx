import { GetServerSideProps, GetServerSidePropsContext } from "next";
import { ROUTES } from "@/shared/routes";

export async function withAuth(
  context: GetServerSidePropsContext,
  redirect = ROUTES.LOGIN(context.resolvedUrl)
): ReturnType<GetServerSideProps> {
  const cookies = context.req.cookies;
  const { userCredentials } = cookies;

  if (userCredentials && typeof userCredentials === "string") {
    try {
      const parsed = JSON.parse(userCredentials);
      // Kiểm tra cookie thực sự chứa authToken hợp lệ
      if (parsed.authToken) {
        return {
          props: {},
        };
      }
    } catch {
      // Cookie bị corrupt, cho qua để redirect về login
    }
  }

  return {
    redirect: {
      destination: `${redirect}?redirect=${encodeURIComponent(
        context.resolvedUrl
      )}`,
      statusCode: 302,
    },
  };
}
