import { withGuest, withMasterData, withMultipleWrapper } from "@/shared/hoc";
import type { GetServerSideProps } from "next";
import type { RegisterPageConfig } from "@/shared/types/admin-config";

export { PageRegister as default } from "@/pages/account/register";

// Wrapper function để đọc register page config
const withRegisterConfig = async (
  context: Parameters<GetServerSideProps>[0]
) => {
  let registerConfig: RegisterPageConfig;

  try {
    // Gọi API route nội bộ để đọc config
    const protocol = context.req.headers["x-forwarded-proto"] || "http";
    const host = context.req.headers.host || "localhost:3000";
    const baseUrl = `${protocol}://${host}`;

    const res = await fetch(`${baseUrl}/api/admin/account/register-config`, {
      headers: {
        cookie: context.req.headers.cookie || "",
      },
    });

    if (res.ok) {
      registerConfig = await res.json();
    } else {
      throw new Error("Failed to fetch config");
    }
  } catch {
    // Nếu API route fail, dùng config mặc định
    registerConfig = {
      backgroundColor: "linear-gradient(rgb(255, 255, 255) 0%, rgb(239, 241, 255) 100%)",
    };
  }

  return {
    props: {
      registerConfig,
    },
  };
};

export const getServerSideProps: GetServerSideProps = withMultipleWrapper(
  withMasterData,
  withGuest,
  withRegisterConfig
);
