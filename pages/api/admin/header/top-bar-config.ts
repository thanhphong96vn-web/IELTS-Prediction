import type { NextApiRequest, NextApiResponse } from "next";
import { readConfig } from "../../../../lib/server/admin-config-helper";
import type { TopBarConfig } from "../../../../src/widgets/layouts/base/ui/header/types";

const defaultConfig: TopBarConfig = {
  facebookFollowers: "500k Followers",
  phoneNumber: "",
  promotionalBanner: {
    buttonText: "Hot",
    emoji: "👋",
    text: "Intro price. Get {siteName} for Big Sale -95% off.",
  },
  socialLinks: {
    enabled: true,
    customLinks: [],
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const config = await Promise.resolve(readConfig<TopBarConfig>("header/top-bar"));
    // Validate config có đầy đủ properties
    if (!config || !config.promotionalBanner) {
      throw new Error("Invalid config structure");
    }
    return res.status(200).json(config);
  } catch {
    return res.status(200).json(defaultConfig);
  }
}

