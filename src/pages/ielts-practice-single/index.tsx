import { createServerApolloClient } from "@/shared/graphql";
import { withMasterData, withMultipleWrapper } from "@/shared/hoc";
import { GetServerSideProps, GetServerSidePropsContext } from "next";
import { GET_PRACTICE_SINGLE, IPracticeSingleResponse } from "./api";
import { ROUTES } from "@/shared/routes";

export { PageIELTSPracticeSingle } from "./ui";

export const getServerSideProps: GetServerSideProps = withMultipleWrapper(
  withMasterData,
  async (context: GetServerSidePropsContext) => {
    const {
      query: { slug },
    } = context;
    const { client } = createServerApolloClient(context);

    const {
      data: { quiz: post },
    } = await client.query<IPracticeSingleResponse, { id: string }>({
      query: GET_PRACTICE_SINGLE,
      variables: {
        id: slug?.toString() || "",
      },
      context: {
        authRequired: true,
      },
    });

    if (!post) {
      return {
        notFound: true,
      };
    }

    if (!post.hasAccess) {
      return {
        redirect: {
          destination: ROUTES.HOME,
          permanent: false,
        },
      };
    }

    return {
      props: {
        post,
      },
    };
  }
);
