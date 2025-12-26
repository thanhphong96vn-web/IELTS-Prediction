import type { NextApiRequest, NextApiResponse } from "next";
import { readConfig } from "../../../../lib/server/admin-config-helper";
import type { PracticeLibraryBannerConfig } from "@/shared/types/admin-config";

/**
 * API route để đọc practice library banner config
 * Chỉ dùng trong getServerSideProps
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<PracticeLibraryBannerConfig | { error: string }>
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const config = await Promise.resolve(readConfig<PracticeLibraryBannerConfig>(
      "ielts-practice-library/banner"
    ));
    // Validate config có đầy đủ properties
    if (!config || !config.listening || !config.reading) {
      throw new Error("Invalid config structure");
    }
    return res.status(200).json(config);
  } catch {
    // Trả về config mặc định nếu file không tồn tại
    const defaultConfig: PracticeLibraryBannerConfig = {
      listening: {
        title: "IELTS Listening Practice Tests",
        description: [
          "IELTS Listening Practice Tests Online miễn phí tại DOL Academy với đề",
          "thi, audio, transcript, answer key, giải thích chi tiết từ vựng đi kèm và",
          "trải nghiệm làm bài thi thử như trên máy.",
        ],
        button: {
          text: "Tìm hiểu khóa học",
          link: "#",
        },
      },
      reading: {
        title: "IELTS Reading Practice Tests",
        description: [
          "IELTS Reading Practice Tests Online miễn phí tại DOL Academy với đề",
          "thi, transcript, answer key, giải thích chi tiết từ vựng đi kèm và",
          "trải nghiệm làm bài thi thử như trên máy.",
        ],
        button: {
          text: "Tìm hiểu khóa học",
          link: "#",
        },
      },
    };
    return res.status(200).json(defaultConfig);
  }
}

