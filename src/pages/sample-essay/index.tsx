import { createServerApolloClient } from "@/shared/graphql";
import { GetServerSideProps, GetServerSidePropsContext } from "next";
import {
  GET_FILTER_DATA,
  GET_FILTER_DATA_RESPONSE,
  GET_SAMPLE_ESSAY_BY_SLUG,
  GET_SAMPLE_ESSAY_BY_SLUG_RESPONSE,
  GET_SAMPLE_ESSAY_BY_SLUG_VARIABLES,
  GET_SAMPLE_ESSAY_VARIABLES,
  GET_SAMPLE_ESSAYS,
  SampleEssayResponse,
} from "./api";
import _ from "lodash";
import { ROUTES } from "@/shared/routes";

export * from "./ui";

export const getServerSidePropsArchive = async (
  context: GetServerSidePropsContext,
  skill: "speaking" | "writing" | "reading" | "listening"
): ReturnType<GetServerSideProps> => {
  const pageSize = 18;
  const paged =
    context.query.slug?.at(-2) === "page" ? context.query.slug.at(-1) : 1;

  const params = _.omit(context.query, ["slug"]);

  if (params.sort) {
    switch (params.sort) {
      case "newest":
        _.set(params, "orderby", [{ field: "DATE", order: "DESC" }]);
        break;
      case "oldest":
        _.set(params, "orderby", [{ field: "DATE", order: "ASC" }]);
        break;
      case "a-z":
        _.set(params, "orderby", [{ field: "TITLE", order: "ASC" }]);
        break;
      case "z-a":
        _.set(params, "orderby", [{ field: "TITLE", order: "DESC" }]);
        break;
      default:
        _.set(params, "orderby", [{ field: "DATE", order: "DESC" }]);
        break;
    }
  }

  const { client } = createServerApolloClient(context);

  const {
    data: { sampleEssayType },
  } = await client.query<SampleEssayResponse, GET_SAMPLE_ESSAY_VARIABLES>({
    query: GET_SAMPLE_ESSAYS,
    variables: {
      skill,
      offsetPagination: {
        offset: (Number(paged) - 1) * pageSize,
        size: pageSize,
      },
      ...params,
    },
  });

  if (!sampleEssayType) {
    return {
      notFound: true,
    };
  }

  const { data: filterData } = await client.query<GET_FILTER_DATA_RESPONSE>({
    query: GET_FILTER_DATA,
  });

  return {
    props: {
      ...sampleEssayType,
      filterData,
      paged: Number(paged),
      pageSize,
      skill,
    },
  };
};

export type SampleEssayProps = {
  paged: number;
  pageSize: number;
  skill: "speaking" | "writing" | "reading" | "listening";
  filterData: GET_FILTER_DATA_RESPONSE;
} & SampleEssayResponse["sampleEssayType"];

export const getServerSidePropsSingle = async (
  context: GetServerSidePropsContext,
  singleID: string
): ReturnType<GetServerSideProps> => {
  const { client } = createServerApolloClient(context);

  const {
    data: { sampleEssay: post },
  } = await client.query<
    GET_SAMPLE_ESSAY_BY_SLUG_RESPONSE,
    GET_SAMPLE_ESSAY_BY_SLUG_VARIABLES
  >({
    query: GET_SAMPLE_ESSAY_BY_SLUG,
    variables: {
      id: singleID,
    },
    context: {
      authRequired: true,
    },
  });

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
      sampleEssay: post,
    },
  };
};
