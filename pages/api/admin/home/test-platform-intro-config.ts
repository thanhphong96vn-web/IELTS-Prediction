import type { NextApiRequest, NextApiResponse } from "next";
import { readConfig } from "../../../../lib/server/admin-config-helper";
import type { TestPlatformIntroConfig } from "./test-platform-intro";

/**
 * API route để đọc test platform intro config
 * Chỉ dùng trong getServerSideProps
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<TestPlatformIntroConfig | { error: string }>
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const config = readConfig<TestPlatformIntroConfig>("test-platform-intro");
    return res.status(200).json(config);
  } catch (error) {
    // Trả về config mặc định nếu file không tồn tại
    const defaultConfig: TestPlatformIntroConfig = {
      badge: {
        text: "CATEGORIES",
      },
      title: {
        line1: "Explore Top Courses Caterories",
        line2: "That",
        line3: "Change",
        line4: "Yourself",
      },
      categories: [
        {
          name: "FULL TEST",
          href: "/ielts-exam-library",
          icon: "/full_test.jpg",
        },
        {
          name: "LISTENING",
          href: "/ielts-practice-library/listening",
          icon: "/listening.jpg",
        },
        {
          name: "READING",
          href: "/ielts-practice-library/reading",
          icon: "/reading.jpg",
        },
        {
          name: "SAMPLE WRITING",
          href: "/ielts-writing-sample",
          icon: "/writing.jpg",
        },
        {
          name: "SAMPLE SPEAKING",
          href: "/ielts-speaking-sample",
          icon: "/speaking.jpg",
        },
      ],
    };
    return res.status(200).json(defaultConfig);
  }
}

