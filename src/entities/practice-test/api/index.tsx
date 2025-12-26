import { gql } from "@apollo/client";

export const GET_PRACTICE_TESTS = gql`
  query GET_PRACTICE_TESTS(
    $size: MediaItemSizeEnum = MEDIUM
    $offsetPagination: OffsetPagination = { offset: 0, size: 9 }
    $skill: String = null
    $question_form: String = null
    $search: String = null
    $orderby: [PostObjectsConnectionOrderbyInput] = [
      { field: DATE, order: DESC }
    ]
    $type: String = "practice"
    $source: String = null
    $quarter: String = null
    $year: String = null
    $part: String = null
  ) {
    quizzes(
      where: {
        offsetPagination: $offsetPagination
        skill: $skill
        questionForm: $question_form
        search: $search
        orderby: $orderby
        type: $type
        source: $source
        quarter: $quarter
        year: $year
        part: $part
      }
    ) {
      edges {
        node {
          id
          featuredImage {
            node {
              sourceUrl(size: $size)
              altText
            }
          }
          title
          quizFields {
            testsTaken
            type
            skill
            proUserOnly
            passages {
              questions {
                __typename
                explanations {
                  __typename
                }
              }
            }
            part
            quarter
            source
            year
          }
          slug
        }
      }
      pageInfo {
        offsetPagination {
          total
        }
      }
    }
  }
`;

export type IPracticeTest = {
  id: string;
  title: string;
  slug: string;
  featuredImage?: {
    node: {
      sourceUrl: string;
      altText: string;
    };
  };
  quizFields: {
    testsTaken: number;
    type: ["academic" | "general" | "practice", string];
    skill: ["reading" | "listening", string];
    proUserOnly: boolean;
    passages: {
      questions: {
        __typename: string;
        explanations: object[];
      }[];
    }[];
    part: string;
    quarter: string;
    source: string;
    year: string;
  };
};

export type IPracticeTestResponses = {
  quizzes: {
    edges: {
      node: IPracticeTest;
    }[];
    pageInfo: {
      offsetPagination: {
        total: number;
      };
    };
  };
};

export const GET_TEST_RESULT = gql`
  query GET_TEST_RESULT($quizId: ID!, $authorId: ID) {
    testResults(
      where: { quizId: $quizId, status: DRAFT, authorId: $authorId }
      first: 1
    ) {
      nodes {
        id
        testResultFields {
          answers
        }
      }
    }
    publishedResults: testResults(
      where: { quizId: $quizId, status: PUBLISH, authorId: $authorId }
      first: 1
    ) {
      nodes {
        id
      }
    }
  }
`;

export type ITestResult = {
  id: string;
  testResultFields: {
    answers: string;
  };
};

export type IPublishedResult = {
  id: string;
};

export type ITestResultResponses = {
  testResults: {
    nodes: ITestResult[];
  };
  publishedResults: {
    nodes: IPublishedResult[];
  };
};
