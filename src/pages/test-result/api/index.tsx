import { SEOFragment, SEOType } from "@/shared/graphql";
import { gql } from "@apollo/client";

export const GET_TEST_RESULT = gql`
  query GET_TEST_RESULT($id: ID!) {
    testResult(id: $id) {
      id
      testResultFields {
        answers
        dateSubmitted
        dateTaken
        score
        quiz {
          node {
            id
          }
        }
        testPart
        testTime
        timeLeft
      }
      status
      authorId
    }
  }
`;

export type ITestResult = {
  id: string;
  testResultFields: {
    answers: string;
    dateSubmitted: string;
    dateTaken: string;
    score: number;
    quiz: {
      node: {
        id: string;
      };
    };
    testPart: string;
    testTime: number;
    timeLeft: string;
  };
  status: "publish" | "draft";
  authorId: string;
};

export type ITestResultResponse = {
  testResult: ITestResult;
};

export type ITestResultVariables = {
  id: string;
};

// =================== QUERY ĐÃ ĐƯỢC CẬP NHẬT ===================
export const GET_PRACTICE_SINGLE = gql`
  query GET_PRACTICE_SINGLE($id: ID! = "") {
    quiz(id: $id) {
      id
      ${SEOFragment}
      title
      excerpt
      slug
      author {
        node {
          name
        }
      }
      date
      featuredImage {
        node {
          sourceUrl(size: LARGE)
          altText
        }
      }
      link
      quizFields {
        testsTaken
        proUserOnly
        time
        scoreType
        type
        skill
        audio {
          node {
            id
            mediaItemUrl
          }
        }
        passages {
          passage_content
          title
          questions {
            type
            title
            question
            list_of_questions {
              correct
              options {
                content
              }
              question
            }
            list_of_options {
              option
              correct
            }
            instructions
            explanations {
              content
            }
            question_form

            # --- Dữ liệu cho Matching Question ---
            matchingQuestion {
              layoutType
              summaryText
              matchingItems {
                questionPart
                correctAnswer
              }
              answerOptions {
                optionText
              }
            }
            # ------------------------------------

            # ▼▼▼ BẮT ĐẦU CẬP NHẬT ▼▼▼
            matrixQuestion {
              matrixCategories {
                categoryLetter
                categoryText
              }
              matrixItems {
                itemText
                correctCategoryLetter
              }
            }
            # ▲▲▲ KẾT THÚC CẬP NHẬT ▲▲▲
          }
        }
      }
    }
  }
`;
// =============================================================

export type IPracticeSingleResponse = {
  quiz: IPracticeSingle;
};

export type IPracticeSingle = {
  id: string;
  title: string;
  excerpt: string;
  seo: SEOType;
  link: string;
  slug: string;
  author: {
    node: {
      name: string;
    };
  };
  date: string;
  featuredImage?: {
    node: {
      sourceUrl: string;
      altText: string;
    };
  };
  quizFields: {
    testsTaken: number;
    proUserOnly: boolean;
    type: [string, string];
    skill: [string, string];
    time: number;
    scoreType: [string, string];
    audio?: {
      node: {
        id: string;
        mediaItemUrl: string;
      };
    };
    passages: {
      title: string;
      passage_content: string;
      questions: (IQuestion & {
        startIndex?: number;
      })[];
    }[];
  };
};

export type IQuestion = {
  question_form: [string, string];
  title: string;
  type: [string, string];
  question?: string;
  instructions?: string;
  list_of_questions?: {
    question: string;
    options: {
      content: string;
    }[];
    correct: number;
  }[];
  list_of_options?: {
    option: string;
    correct?: boolean;
  }[];
  explanations: {
    content: string;
  }[];
  matchingQuestion?: {
    layoutType?: 'standard' | 'summary' | 'heading';
    summaryText?: string;
    matchingItems?: {
      questionPart: string;
      correctAnswer: string;
    }[];
    answerOptions?: {
      optionText: string;
    }[];
  };
  // ▼▼▼ BẮT ĐẦU CẬP NHẬT TYPE ▼▼▼
  matrixQuestion?: {
    matrixCategories: {
      categoryLetter: string;
      categoryText: string;
    }[];
    matrixItems: {
      itemText: string;
      correctCategoryLetter: string;
    }[];
  };
  // ▲▲▲ KẾT THÚC CẬP NHẬT TYPE ▲▲▲
};

export const GET_USER = gql`
  query GET_USER($id: ID!) {
    user(id: $id) {
      id
      name
      userData {
        avatar {
          node {
            mediaDetails {
              sizes {
                sourceUrl
                width
              }
            }
            srcSet
          }
        }
      }
    }
  }
`;

export type IUser = {
  name: string;
  userData: {
    avatar?: {
      node: {
        mediaDetails: {
          sizes: Array<{
            sourceUrl: string;
            width: string;
          }>;
        };
        srcSet: string;
      };
    };
  };
};

export type IUserResponse = {
  user: IUser;
};
