import { withGuest, withMasterData, withMultipleWrapper } from "@/shared/hoc";

export { PageRegister as default } from "@/pages/account/register";

export const getServerSideProps = withMultipleWrapper(
  withMasterData,
  withGuest
);
