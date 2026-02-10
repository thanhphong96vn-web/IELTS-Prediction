import { gql } from "@apollo/client";
import { SEOFragment, SEOType } from "@/shared/graphql";

export const GET_PRACTICE_SINGLE = gql`
  query GET_PRACTICE_SINGLE($id: ID! = "") {
    quiz(id: $id, idType: SLUG) {
      id
      ${SEOFragment}
      title
      excerpt
      slug
      hasAccess
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
              # ▼▼▼ SỬA LỖI DỨT ĐIỂM TẠI ĐÂY: XÓA DÒNG GÂY LỖI ▼▼▼
              # correctAnswer  <-- Dòng này đã được xóa
            }
            question_form
            
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
              layoutType
              legendTitle
            }
          }
        }
        pdf {
          node {
            id
            mediaItemUrl
            databaseId
          }
        }
      }
      relatedPracticeQuizzes
    }
  }
`;

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
  hasAccess: boolean;
  relatedPracticeQuizzes: {
    databaseId: number;
    title: string;
    featuredImage: false | string;
    excerpt: string;
    slug: string;
  }[];
  author: {
    node: {
      userData: {
        avatar?: {
          node: {
            sourceUrl: string;
          };
        };
      };
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
    type: ["academic" | "general" | "practice", string];
    skill: ["reading" | "listening", string];
    time: number;
    scoreType: ["band", string] | ["percentage", string];
    audio?: {
      node: {
        id: string;
        mediaItemUrl: string;
        databaseId: number;
      };
    };
    passages: {
      title: string;
      passage_content: string;
      audio_start?: string;
      audio_end?: string;
      questions: {
        startIndex?: number;
        question_form: [
          (
            | "summary_completion"
            | "true_false_not_given"
            | "multiple_choice"
            | "matching_paragraph_information"
            | "matching_name"
            | "yes_no_not_given"
            | "matching_headings"
            | "sentence_completion"
            | "list_selection"
            | "short_answer"
            | "matching_sentence_endings"
            | "table_completion"
            | "diagram_completion"
            | "flow_chart_completion"
            | "choose_a_title"
            | "uncategorized"
          ),
          string
        ];
        title: string;
        type: [
          "fillup" | "radio" | "select" | "checkbox" | "matching" | "matrix",
          string
        ];
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

        matrixQuestion?: {
          matrixCategories: {
            categoryLetter: string;
            categoryText: string;
          }[];
          matrixItems: {
            itemText: string;
            correctCategoryLetter: string;
          }[];
          layoutType?: "standard" | "simple";
          legendTitle?: string;
        };
      }[];
    }[];
    pdf?: {
      node: {
        id: string;
        mediaItemUrl: string;
        databaseId: number;
      };
    };
  };
};