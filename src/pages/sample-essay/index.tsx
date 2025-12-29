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
import type { SampleEssayBannerConfig } from "./ui/archive/types";

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

  // Fetch banner config
  let bannerConfig: SampleEssayBannerConfig;
  try {
    const protocol = context.req.headers["x-forwarded-proto"] || "http";
    const host = context.req.headers.host || "localhost:3000";
    const baseUrl = `${protocol}://${host}`;

    const res = await fetch(
      `${baseUrl}/api/admin/sample-essay/banner-config`,
      {
        headers: {
          cookie: context.req.headers.cookie || "",
        },
      }
    );

    if (res.ok) {
      bannerConfig = await res.json();
    } else {
      throw new Error("Failed to fetch config");
    }
  } catch {
    bannerConfig = {
      writing: {
        title: {
          line1: "DOL IELTS Writing",
          line2: {
            highlighted: "Task 1 Academic",
            after: "Sample",
          },
        },
        description: {
          line1: "Tổng hợp bài mẫu IELTS Exam Writing Task 1 và hướng dẫn cách làm bài,",
          line2: "từ vựng chi tiết theo chủ đề.",
        },
        backgroundColor: "linear-gradient(180deg, #FFF3F3 0%, #FFF8F0 100%)",
        button: {
          text: "Tìm hiểu khóa học",
          link: "#",
        },
      },
      speaking: {
        title: {
          line1: "DOL IELTS Speaking",
          line2: {
            highlighted: "Task 1 Academic",
            after: "Sample",
          },
        },
        description: {
          line1: "Tổng hợp bài mẫu IELTS Exam Speaking Task 1 và hướng dẫn cách làm bài,",
          line2: "từ vựng chi tiết theo chủ đề.",
        },
        backgroundColor: "linear-gradient(180deg, #FFF3F3 0%, #FFF8F0 100%)",
        button: {
          text: "Tìm hiểu khóa học",
          link: "#",
        },
      },
    };
  }

  return {
    props: {
      ...sampleEssayType,
      filterData,
      paged: Number(paged),
      pageSize,
      skill,
      bannerConfig,
    },
  };
};

export type SampleEssayProps = {
  paged: number;
  pageSize: number;
  skill: "speaking" | "writing" | "reading" | "listening";
  filterData: GET_FILTER_DATA_RESPONSE;
  bannerConfig: SampleEssayBannerConfig;
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
