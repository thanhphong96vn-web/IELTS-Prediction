import type { NextApiRequest, NextApiResponse } from "next";
import { readConfig } from "../../../../lib/server/admin-config-helper";
import type { ExamLibraryHeroConfig } from "@/shared/types/admin-config";

/**
 * API route để đọc exam library hero config
 * Chỉ dùng trong getServerSideProps
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ExamLibraryHeroConfig | { error: string }>
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const config = readConfig<ExamLibraryHeroConfig>(
      "ielts-exam-library/hero-banner"
    );
    return res.status(200).json(config);
  } catch {
    // Trả về config mặc định nếu file không tồn tại
    const defaultConfig: ExamLibraryHeroConfig = {
      title: "IELTS Exam Library",
      breadcrumb: {
        homeLabel: "Home",
        currentLabel: "IELTS Exam Library",
      },
    };
    return res.status(200).json(defaultConfig);
  }
}


