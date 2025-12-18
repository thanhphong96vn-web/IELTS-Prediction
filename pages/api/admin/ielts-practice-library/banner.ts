import type { NextApiRequest, NextApiResponse } from "next";
import { readConfig, writeConfig } from "../../../../lib/server/admin-config-helper";

export interface PracticeLibraryBannerConfig {
  listening: {
    title: string;
    description: string[];
    button: {
      text: string;
      link: string;
    };
  };
  reading: {
    title: string;
    description: string[];
    button: {
      text: string;
      link: string;
    };
  };
}

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const sectionName = "ielts-practice-library/banner";

  if (req.method === "GET") {
    try {
      const config = readConfig<PracticeLibraryBannerConfig>(sectionName);
      return res.status(200).json(config);
    } catch (error) {
      return res.status(500).json({
        message: "Không đọc được file config",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  if (req.method === "POST") {
    try {
      // TODO: Thêm authentication check ở đây
      // if (!isAdmin(req)) return res.status(401).json({ message: "Unauthorized" });

      const body = req.body as PracticeLibraryBannerConfig;
      writeConfig<PracticeLibraryBannerConfig>(sectionName, body);
      return res.status(200).json({ message: "Lưu config thành công" });
    } catch (error) {
      return res.status(500).json({
        message: "Không ghi được file config",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return res.status(405).json({ message: "Method not allowed" });
}

