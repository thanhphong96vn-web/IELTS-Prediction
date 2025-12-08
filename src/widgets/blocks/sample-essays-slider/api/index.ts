import { gql } from "@apollo/client";

export const GET_SAMPLE_ESSAYS = gql`
  query GET_SAMPLE_ESSAYS(
    $skill: ID = "speaking"
    $orderby: [PostObjectsConnectionOrderbyInput] = [
      { field: DATE, order: DESC }
    ]
    $quarter: String
    $questionType: String
    $search: String
    $year: String
    $sampleSource: String
    $part: String
    $topic: String
    $task: String
    $passage: String
    $offsetPagination: OffsetPagination = { offset: 0, size: 10 }
  ) {
    sampleEssayType(id: $skill, idType: SLUG) {
      sampleEssays(
        where: {
          orderby: $orderby
          year: $year
          sampleSource: $sampleSource
          search: $search
          quarter: $quarter
          part: $part
          questionType: $questionType
          topic: $topic
          task: $task
          passage: $passage
          offsetPagination: $offsetPagination
        }
      ) {
        edges {
          node {
            id
            slug
            title
            date
            featuredImage {
              node {
                sourceUrl(size: LARGE)
                altText
              }
            }
            sampleEssayFields {
              quarter
            }
            speakingSampleEssayFields {
              part
              questionType
            }
            writingSampleEssayFields {
              topic
              task
            }
            postMeta{
              views
              proUserOnly
            }
            hasAccess
          }
        }
        pageInfo {
          offsetPagination {
            total
            hasMore
            hasPrevious
          }
        }
      }
    }
  }
`;

export type GET_SAMPLE_ESSAY_VARIABLES = {
  skill?: "speaking" | "writing" | "reading" | "listening";
  orderby?: {
    field: string;
    order: string;
  }[];
  quarter?: string;
  questionType?: string;
  search?: string;
  year?: string;
  sampleSource?: string;
  part?: string;
  topic?: string;
  task?: string;
  passage?: string;
  offsetPagination?: {
    offset: number;
    size: number;
  };
};

export type SampleEssay = {
  id: string;
  slug: string;
  title: string;
  date: string;
  featuredImage?: {
    node: {
      sourceUrl: string;
      altText: string;
    };
  };
  sampleEssayFields: {
    quarter: [string, string];
    year: [string, string];
    sampleSource: [string, string];
  };
  speakingSampleEssayFields: {
    part: [string, string];
    questionType: [string, string];
  };
  writingSampleEssayFields: {
    topic: [string, string];
    task: [string, string];
  };
  postMeta: {
    views: number;
    proUserOnly: boolean;
  };
  hasAccess: boolean;
};

export type SampleEssayResponse = {
  sampleEssayType: {
    sampleEssays: {
      edges: {
        node: SampleEssay;
      }[];
      pageInfo: {
        offsetPagination: {
          total: number;
          hasMore: boolean;
          hasPrevious: boolean;
        };
      };
    };
  };
};