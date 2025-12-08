import { GetServerSideProps, GetServerSidePropsContext } from "next";
import { ROUTES } from "@/shared/routes";

export async function withGuest(
  context: GetServerSidePropsContext,
  redirect = ROUTES.HOME
): ReturnType<GetServerSideProps> {
  const cookies = context.req.cookies;
  const { userCredentials } = cookies;

  if (userCredentials && typeof userCredentials === "string") {
    return {
      redirect: {
        destination: redirect,
        statusCode: 302,
      },
    };
  }

  return {
    props: {},
  };
}
