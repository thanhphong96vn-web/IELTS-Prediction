import { gql } from "@apollo/client";
import { SEOFragment, SEOType } from "@/shared/graphql";
import { IPracticeSingle } from "@/pages/ielts-practice-single/api"; // Tái sử dụng type chính

export const GET_PRACTICE_SINGLE = gql`
  query GET_PRACTICE_SINGLE($id: ID! = "") {
    quiz(id: $id, idType: SLUG) {
      id
      ${SEOFragment}
      title
      excerpt
      author {
        node {
          userData {
            avatar {
              node {
                sourceUrl(size: THUMBNAIL)
              }
            }
          }
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
        proUserOnly
        time
        scoreType
        type
        skill
        audio {
          node {
            id
            mediaItemUrl
            databaseId
          }
        }
        passages {
          passage_content
          title
          audio_start
          audio_end
          questions {
            type
            title
            question
            list_of_questions {
              question
              correct
              options {
                content
              }
            }
            list_of_options {
              correct
              option
            }
            instructions
            explanations {
              content
            }
            question_form
            optionChoose
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

export const SAVE_DRAFT = gql`
  mutation SAVE_DRAFT($answers: String!, $testId: ID!, $timeLeft: String!) {
    saveTestResult(
      input: { answers: $answers, testId: $testId, timeLeft: $timeLeft }
    ) {
      clientMutationId
    }
  }
`;

export type IDraft = {
  clientMutationId: string;
};

export type IDraftResponse = {
  saveTestResult: IDraft;
};

export const TAKE_THE_TEST = gql`
  mutation TAKE_THE_TEST(
    $quizId: ID!
    $testPart: String!
    $testTime: Int!
    $testMode: String!
    $retake: Boolean!
  ) {
    takeTheTest(
      input: {
        quizId: $quizId
        testPart: $testPart
        testTime: $testTime
        testMode: $testMode
        retake: $retake
      }
    ) {
      data
    }
  }
`;

export type TakeTheTestResponse = {
  takeTheTest: {
    data: {
      id: string;
      quiz: number;
      test_part: string;
      test_time: string;
      test_mode: string;
    };
  };
};

export const GET_TEST_RESULT = gql`
  query GET_TEST_RESULT($id: ID!) {
    testResult(id: $id) {
      testResultFields {
        answers
        testPart
        timeLeft
        testTime
        testMode
      }
    }
  }
`;

export type ITestResult = {
  testResultFields: {
    answers: string;
    testPart: string;
    timeLeft?: string;
    testTime: number;
    testMode: "practice" | "simulation";
  };
};

export type ITestResultResponse = {
  testResult: ITestResult;
};

export const SUBMIT_ANSWER = gql`
  mutation SUBMIT_ANSWER($input: SubmitTestResultInput!) {
    submitTestResult(input: $input) {
      clientMutationId
    }
  }
`;

export type ISubmitAnswerVariables = {
  input: {
    answers: string;
    dateSubmitted: number;
    testId: string;
    timeLeft: string;
  };
};