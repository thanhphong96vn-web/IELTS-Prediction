import { GetServerSideProps, GetServerSidePropsContext } from "next";
import { ROUTES } from "@/shared/routes";

export async function withAuth(
  context: GetServerSidePropsContext,
  redirect = ROUTES.LOGIN(context.resolvedUrl)
): ReturnType<GetServerSideProps> {
  const cookies = context.req.cookies;
  const { userCredentials } = cookies;

  if (userCredentials && typeof userCredentials === "string") {
    return {
      props: {},
    };
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
