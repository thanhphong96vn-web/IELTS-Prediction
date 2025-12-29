import { createServerApolloClient } from "@/shared/graphql";
import { withMasterData, withMultipleWrapper } from "@/shared/hoc";
import { gql } from "@apollo/client";
import { GetServerSideProps } from "next";
import type { PracticeLibraryBannerConfig } from "./ui/types";

export { PageIELTSPracticeLibrary } from "./ui";

const GET_FILTER_DATA = gql`
  query GET_FILTER_DATA($skill: String) {
    quizFilterData(skill: $skill)
  }
`;

type GET_FILTER_DATA_RESPONSE = {
  quizFilterData: {
    years: Array<string>;
    sources: Array<string>;
    parts: Array<string>;
  };
};

// Wrapper function để đọc banner config cho Practice Library
const withPracticeLibraryBannerConfig = async (
  context: Parameters<GetServerSideProps>[0]
) => {
  let bannerConfig: PracticeLibraryBannerConfig;

  try {
    const protocol = context.req.headers["x-forwarded-proto"] || "http";
    const host = context.req.headers.host || "localhost:3000";
    const baseUrl = `${protocol}://${host}`;

    const res = await fetch(
      `${baseUrl}/api/admin/ielts-practice-library/banner-config`,
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
      listening: {
        title: "IELTS Listening Practice Tests",
        description: {
          line1:
            "IELTS Listening Practice Tests Online miễn phí tại IELTS PREDICTION với đề",
          line2:
            "thi, audio, transcript, answer key, giải thích chi tiết từ vựng đi kèm và",
          line3: "trải nghiệm làm bài thi thử như trên máy.",
        },
        backgroundColor: "linear-gradient(180deg, #FFF3F3 0%, #FFF8F0 100%)",
        button: {
          text: "Tìm hiểu khóa học",
          link: "#",
        },
      },
      reading: {
        title: "IELTS Reading Practice Tests",
        description: {
          line1:
            "IELTS Reading Practice Tests Online miễn phí tại DOL Academy với đề",
          line2:
            "thi, transcript, answer key, giải thích chi tiết từ vựng đi kèm và",
          line3: "trải nghiệm làm bài thi thử như trên máy.",
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
      bannerConfig,
    },
  };
};

export const getServerSideProps: GetServerSideProps = withMultipleWrapper(
  withMasterData,
  async (context) => {
    const { resolvedUrl } = context;
    const skill = resolvedUrl.split("/").at(-1);

    const { client } = createServerApolloClient(context);

    const {
      data: { quizFilterData },
    } = await client.query<GET_FILTER_DATA_RESPONSE>({
      query: GET_FILTER_DATA,
      variables: {
        skill,
      },
    });

    return {
      props: {
        quizFilterData,
      },
    };
  },
  withPracticeLibraryBannerConfig
);
