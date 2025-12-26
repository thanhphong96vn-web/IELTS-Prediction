import { withGuest, withMasterData, withMultipleWrapper } from "@/shared/hoc";

export { PageLogin as default } from "@/pages/account/login";

export const getServerSideProps = withMultipleWrapper(
  withMasterData,
  withGuest
);
