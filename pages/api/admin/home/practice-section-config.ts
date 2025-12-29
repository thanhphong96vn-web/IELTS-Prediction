import type { NextApiRequest, NextApiResponse } from "next";
import { readConfig } from "../../../../lib/server/admin-config-helper";
import type { PracticeSectionConfig } from "@/shared/types/admin-config";

/**
 * API route để đọc practice section config
 * Chỉ dùng trong getServerSideProps
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<PracticeSectionConfig | { error: string }>
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const config = await Promise.resolve(readConfig<PracticeSectionConfig>("practice-section"));
    // Validate config có đầy đủ properties
    if (!config || !config.backgroundGradient) {
      throw new Error("Invalid config structure");
    }
    return res.status(200).json(config);
  } catch (error) {
    // Trả về config mặc định nếu file không tồn tại
    const defaultConfig: PracticeSectionConfig = {
      backgroundGradient: "linear-gradient(180deg, #FF6B6B 0%, #FF8C42 100%)",
    };
    return res.status(200).json(defaultConfig);
  }
}

