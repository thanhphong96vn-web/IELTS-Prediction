import type { NextApiRequest, NextApiResponse } from "next";
import { readConfig, writeConfig } from "../../../../lib/server/admin-config-helper";

export interface HeroBannerConfig {
  trustpilot: {
    image: string;
    rating: string;
  };
  headline: {
    line1: string;
    line2: string;
    line3: string;
    line4: string;
  };
  description: {
    text: string;
    highlightText: string;
  };
  buttons: {
    primary: {
      text: string;
      link: string;
    };
    secondary: {
      text: string;
      link: string;
    };
  };
  bannerImage: string;
  featureCards: Array<{
    icon: string;
    title?: string;
    value?: string;
    subtitle: string;
    avatars?: string[];
  }>;
  decorativeShape: {
    image: string;
  };
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const sectionName = "hero-banner";

  if (req.method === "GET") {
    try {
      const config = readConfig<HeroBannerConfig>(sectionName);
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

      const body = req.body as HeroBannerConfig;
      writeConfig<HeroBannerConfig>(sectionName, body);
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
