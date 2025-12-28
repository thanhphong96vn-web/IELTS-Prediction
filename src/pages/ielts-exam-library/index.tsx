import { withMasterData, withMultipleWrapper } from "@/shared/hoc";
import { GetServerSideProps } from "next";
import type { ExamLibraryHeroConfig } from "./ui/types";

export { PageIELTSExamLibrary } from "./ui";

// Wrapper function để đọc hero banner config cho IELTS Exam Library
const withExamLibraryHeroConfig = async (
  context: Parameters<GetServerSideProps>[0]
) => {
  let heroConfig: ExamLibraryHeroConfig;

  try {
    // Gọi API route nội bộ để đọc config
    const protocol = context.req.headers["x-forwarded-proto"] || "http";
    const host = context.req.headers.host || "localhost:3000";
    const baseUrl = `${protocol}://${host}`;

    const res = await fetch(
      `${baseUrl}/api/admin/ielts-exam-library/hero-banner-config`,
      {
        headers: {
          cookie: context.req.headers.cookie || "",
        },
      }
    );

    if (res.ok) {
      heroConfig = await res.json();
    } else {
      throw new Error("Failed to fetch config");
    }
  } catch {
    // Nếu API route fail, dùng config mặc định
    heroConfig = {
      title: "IELTS Exam Library",
      backgroundColor: "linear-gradient(rgb(255, 255, 255) 0%, rgb(239, 241, 255) 100%)",
      breadcrumb: {
        homeLabel: "Home",
        currentLabel: "IELTS Exam Library",
      },
    };
  }

  return {
    props: {
      heroConfig,
    },
  };
};

export const getServerSideProps: GetServerSideProps = withMultipleWrapper(
  withMasterData,
  withExamLibraryHeroConfig
);
