import type { NextApiRequest, NextApiResponse } from "next";
import { readConfig, writeConfig } from "../../../../lib/server/admin-config-helper";
import type { WhyChooseUsConfig } from "@/shared/types/admin-config";

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const sectionName = "why-choose-us";

  if (req.method === "GET") {
    try {
      const config = readConfig<WhyChooseUsConfig>(sectionName);
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

      const body = req.body as WhyChooseUsConfig;
      writeConfig<WhyChooseUsConfig>(sectionName, body);
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

