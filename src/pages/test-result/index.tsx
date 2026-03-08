import { createServerApolloClient } from "@/shared/graphql";
import { withAuth, withMasterData, withMultipleWrapper } from "@/shared/hoc";
import { GetServerSideProps, GetServerSidePropsContext } from "next";
import {
  GET_PRACTICE_SINGLE,
  GET_TEST_RESULT,
  GET_USER,
  IPracticeSingleResponse,
  ITestResultResponse,
  ITestResultVariables,
  IUserResponse,
} from "./api";
import { calculateScore } from "@/shared/lib";

export { PageTestResult } from "./ui";

export const getServerSideProps: GetServerSideProps = withMultipleWrapper(
  withAuth,
  withMasterData,
  async (context: GetServerSidePropsContext) => {
    const {
      query: { id },
    } = context;
    const { client } = createServerApolloClient(context);

    // Luôn dùng authRequired: true vì trang này yêu cầu đăng nhập (withAuth)
    // Nếu dùng isSignedIn, khi token hết hạn sẽ query không có auth
    // → WordPress có thể trả về testResult của user khác

    // 1. Fetch dữ liệu bài làm (testResult)
    const {
      data: { testResult },
    } = await client.query<ITestResultResponse, ITestResultVariables>({
      query: GET_TEST_RESULT,
      variables: {
        id: id?.toString() || "",
      },
      context: {
        authRequired: true,
      },
    });

    if (!testResult || testResult.status !== "publish") {
      return {
        notFound: true,
      };
    }

    // 2. Fetch bài quiz
    const {
      data: { quiz: post },
    } = await client.query<IPracticeSingleResponse, { id: string }>({
      query: GET_PRACTICE_SINGLE,
      variables: {
        id: testResult.testResultFields.quiz.node.id,
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

    // 3. Fetch người dùng (dùng viewer thay vì authorId để đảm bảo đúng user đang login)
    // Trước đây dùng testResult.authorId → nếu query không có auth,
    // authorId có thể là của user khác
    const {
      data: { user },
    } = await client.query<IUserResponse, { id: string }>({
      query: GET_USER,
      variables: { id: testResult.authorId },
      context: {
        authRequired: true,
      },
    });

    // 4. Chấm điểm
    const scoreData = calculateScore(
      JSON.parse(testResult.testResultFields.answers).answers,
      post,
      JSON.parse(testResult.testResultFields.testPart)
    );

    // 5. Trả về props
    return {
      props: {
        post,
        testResult,
        user,
        scoreData,
      },
    };
  }
);
