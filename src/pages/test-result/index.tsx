import { createServerApolloClient } from "@/shared/graphql";
import { withMasterData, withMultipleWrapper } from "@/shared/hoc";
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
  withMasterData,
  async (context: GetServerSidePropsContext) => {
    const {
      query: { id },
    } = context;
    const { client } = createServerApolloClient(context);

    // 1. Fetch dữ liệu bài làm (testResult)
    const {
      data: { testResult },
    } = await client.query<ITestResultResponse, ITestResultVariables>({
      query: GET_TEST_RESULT,
      variables: {
        id: id?.toString() || "",
      },
    });

    if (!testResult || testResult.status !== "publish") {
      return {
        notFound: true,
      };
    }

    const {
      data: { quiz: post },
    } = await client.query<IPracticeSingleResponse, { id: string }>({
      query: GET_PRACTICE_SINGLE,
      variables: {
        id: testResult.testResultFields.quiz.node.id,
      },
    });

    if (!post) {
      return {
        notFound: true,
      };
    }
    // ▲▲▲ [KẾT THÚC KHÔI PHỤC] ▲▲▲

    // 3. Fetch người dùng
    const {
      data: { user },
    } = await client.query<IUserResponse, { id: string }>({
      query: GET_USER,
      variables: { id: testResult.authorId },
    });

    // 4. Chấm điểm
    const scoreData = calculateScore(
      JSON.parse(testResult.testResultFields.answers).answers,
      post, // Dùng 'post' vừa fetch được
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
