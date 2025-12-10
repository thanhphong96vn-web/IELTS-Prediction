import { ApolloQueryResult, gql, useQuery } from "@apollo/client";
import { createContext, useContext } from "react";

const GET_TARGET_SCORE = gql`
  query GET_TARGET_SCORE {
    viewer {
      userData {
        targetScore {
          examDate
          listening
          reading
          speaking
          writing
        }
      }
    }
  }
`;

type TargetScore = {
  examDate: string | null;
  listening: number | null;
  reading: number | null;
  speaking: number | null;
  writing: number | null;
};

const defaultValue: TargetScore = {
  examDate: null,
  listening: null,
  reading: null,
  speaking: null,
  writing: null,
};

const WidgetContext = createContext<{
  targetScore: TargetScore;
  refetch: () => Promise<
    ApolloQueryResult<{
      viewer: { userData: { targetScore: TargetScore } };
    }>
  >;
  loading: boolean;
}>({
  targetScore: defaultValue,
  refetch: () =>
    Promise.resolve(
      {} as ApolloQueryResult<{
        viewer: { userData: { targetScore: TargetScore } };
      }>
    ),
  loading: false,
});

export const useWidgetContext = () => {
  return useContext(WidgetContext);
};

export const WidgetContextProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { data, refetch, loading } = useQuery<{
    viewer: { userData: { targetScore: TargetScore } };
  }>(GET_TARGET_SCORE, {
    context: {
      authRequired: true,
    },
    notifyOnNetworkStatusChange: true,
  });

  return (
    <WidgetContext.Provider
      value={{
        targetScore: data?.viewer.userData.targetScore || defaultValue,
        refetch,
        loading,
      }}
    >
      {children}
    </WidgetContext.Provider>
  );
};
