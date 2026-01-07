import { IPracticeSingle } from "@/pages/ielts-practice-single/api";
import { gql } from "@apollo/client";

export const GET_PRACTICE_HISTORY = gql`
  query GET_PRACTICE_HISTORY(
    $authorId: ID!
    $quizSkill: String = "reading"
    $offset: Int = 0
    $size: Int = 100
  ) {
    testResults(
      where: {
        authorId: $authorId
        quizSkill: $quizSkill
        offsetPagination: { offset: $offset, size: $size }
      }
    ) {
      edges {
        node {
          id
          status
          testResultFields {
            answers
            dateSubmitted
            dateTaken
            quiz {
              node {
                ... on Quiz {
                  id
                  title
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
                        databaseId
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
                      }
                    }
                  }
                }
              }
            }
            score
            testTime
            testPart
            timeLeft
          }
        }
      }
      pageInfo {
        offsetPagination {
          hasMore
          hasPrevious
          total
        }
      }
    }
  }
`;

export type TestResult = {
  id: string;
  status: "publish" | "draft";
  testResultFields: {
    answers: string;
    dateSubmitted: string;
    dateTaken: string;
    quiz: {
      node: IPracticeSingle;
    };
    score: number;
    testTime: string;
    testPart: number[];
    timeLeft: string;
  };
};

export type GetPracticeHistory = {
  testResults: {
    edges: {
      node: TestResult;
    }[];
    pageInfo: {
      offsetPagination: {
        hasMore: boolean;
        hasPrevious: boolean;
        total: number;
      };
    };
  };
};

export type GetPracticeHistoryVariables = {
  authorId: string;
  quizSkill: string;
  offset?: number;
  size?: number;
};
