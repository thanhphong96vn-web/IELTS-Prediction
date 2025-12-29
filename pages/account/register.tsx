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
    // Import readConfig trực tiếp thay vì gọi API
    const { readConfig } = await import("../../lib/server/admin-config-helper");
    
    try {
      const config = await Promise.resolve(
        readConfig<RegisterPageConfig>("account/register")
      );
      
      // Validate và đảm bảo có backgroundColor
      registerConfig = {
        backgroundColor: config?.backgroundColor || "linear-gradient(rgb(255, 255, 255) 0%, rgb(239, 241, 255) 100%)",
      };
    } catch (configError: any) {
      console.warn("Failed to read register config:", configError?.message || configError);
      // Nếu đọc config fail, dùng config mặc định
      registerConfig = {
        backgroundColor: "linear-gradient(rgb(255, 255, 255) 0%, rgb(239, 241, 255) 100%)",
      };
    }
  } catch (error: any) {
    console.error("Error in withRegisterConfig:", error?.message || error);
    // Nếu có lỗi, dùng config mặc định
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
