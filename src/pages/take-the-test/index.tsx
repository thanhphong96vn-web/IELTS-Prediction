import { createServerApolloClient } from "@/shared/graphql";
import { withAuth, withMasterData, withMultipleWrapper } from "@/shared/hoc";
import { GetServerSideProps, GetServerSidePropsContext } from "next";
import {
  GET_PRACTICE_SINGLE,
  GET_TEST_RESULT,
  ITestResultResponse,
  TAKE_THE_TEST,
  TakeTheTestResponse,
} from "./api";
import { IPracticeSingleResponse } from "../ielts-practice-single/api";
import { ROUTES } from "@/shared/routes";
// import _ from "lodash";

export { PageTakeTheTestWrapper } from "./ui";

export const getServerSideProps: GetServerSideProps = withMultipleWrapper(
  withAuth,
  withMasterData,
  async (context: GetServerSidePropsContext) => {
    const {
      query: { slug, testId },
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

    // Nếu có testId trong query params, dùng test đó thay vì tạo mới
    if (testId && typeof testId === "string") {
      try {
        const {
          data: { testResult },
        } = await client.query<ITestResultResponse, { id: string }>({
          query: GET_TEST_RESULT,
          variables: {
            id: testId,
          },
          context: {
            authRequired: true,
          },
        });

        if (testResult) {
          return {
            props: {
              post,
              testID: testId,
              testResult,
            },
          };
        }
      } catch (error) {
        // Nếu không tìm thấy test với testId, tiếp tục tạo test mới
        console.warn("Test ID not found, creating new test:", error);
      }
    }

    // Tạo test mới nếu không có testId hoặc testId không hợp lệ
    const testPart = Array.from(
      { length: post.quizFields.passages.length },
      (_, index) => index
    );

    const { data } = await client
      .mutate<
        TakeTheTestResponse,
        {
          quizId: string;
          testPart: string;
          testTime: number;
          testMode: string;
          retake: boolean;
        }
      >({
        mutation: TAKE_THE_TEST,
        variables: {
          quizId: post.id,
          testPart: JSON.stringify(testPart),
          testTime: post.quizFields.time,
          testMode: "practice",
          retake: false,
        },
        context: {
          authRequired: true,
        },
      })
      .catch(() => {
        return { data: null };
      });

    if (!data || !data.takeTheTest.data.id) {
      return {
        redirect: {
          statusCode: 302,
          destination: ROUTES.HOME,
        },
      };
    }

    const {
      data: { testResult },
    } = await client.query<ITestResultResponse, { id: string }>({
      query: GET_TEST_RESULT,
      variables: {
        id: data.takeTheTest.data.id,
      },
      context: {
        authRequired: true,
      },
    });

    return {
      props: {
        // post: newPost,
        post,
        testID: data.takeTheTest.data.id,
        testResult,
      },
    };
  }
);