import { createServerApolloClient } from "@/shared/graphql";
import { withMasterData, withMultipleWrapper } from "@/shared/hoc";
import { gql } from "@apollo/client";
import { GetServerSideProps } from "next";

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
  }
);
