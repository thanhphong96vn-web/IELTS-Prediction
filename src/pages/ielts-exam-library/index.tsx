import { withMasterData, withMultipleWrapper } from "@/shared/hoc";
import { GetServerSideProps } from "next";

export { PageIELTSExamLibrary } from "./ui";

export const getServerSideProps: GetServerSideProps = withMultipleWrapper(
  withMasterData,
  async () => {
    return {
      props: {},
    };
  }
);
