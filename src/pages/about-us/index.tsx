import { withMasterData, withMultipleWrapper } from "@/shared/hoc";
import { GetServerSideProps } from "next";

export { PageAboutUs } from "./ui";

export const getServerSideProps: GetServerSideProps = withMultipleWrapper(
  withMasterData
);

