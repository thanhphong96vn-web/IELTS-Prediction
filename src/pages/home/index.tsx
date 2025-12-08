import { withMasterData, withMultipleWrapper } from "@/shared/hoc";
import { GetServerSideProps } from "next";

export { PageHome } from "./ui";

export const getServerSideProps: GetServerSideProps =
  withMultipleWrapper(withMasterData);
