import type { NextApiRequest, NextApiResponse } from "next";
import { readData, writeData } from "../../../lib/server/affiliate-data-helper";

interface AffiliateUser {
  id: string;
  userId: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  approvedAt?: string;
  customLink?: string;
  emailNotifications: boolean;
}

const AFFILIATES_FILE = "affiliates.json";

async function getAffiliates(): Promise<AffiliateUser[]> {
  try {
    const data = await Promise.resolve(readData<AffiliateUser[]>(AFFILIATES_FILE));
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

async function saveAffiliate(affiliate: AffiliateUser): Promise<void> {
  const affiliates = await getAffiliates();
  const existingIndex = affiliates.findIndex((a) => a.userId === affiliate.userId);
  
  if (existingIndex >= 0) {
    affiliates[existingIndex] = affiliate;
  } else {
    affiliates.push(affiliate);
  }
  
  await Promise.resolve(writeData<AffiliateUser[]>(AFFILIATES_FILE, affiliates));
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "POST") {
    try {
      const { userId } = req.body;

      if (!userId) {
        return res.status(400).json({ error: "User ID is required" });
      }

      const affiliates = await getAffiliates();
      const existing = affiliates.find((a) => a.userId === userId);

      if (existing) {
        return res.status(200).json({
          success: true,
          affiliate: existing,
          message: existing.status === "pending" 
            ? "Đơn đăng ký của bạn đang chờ duyệt"
            : existing.status === "approved"
            ? "Bạn đã là affiliate"
            : "Đơn đăng ký của bạn đã bị từ chối",
        });
      }

      const newAffiliate: AffiliateUser = {
        id: `affiliate_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        status: "pending",
        createdAt: new Date().toISOString(),
        emailNotifications: true,
      };

      await saveAffiliate(newAffiliate);

      return res.status(200).json({
        success: true,
        affiliate: newAffiliate,
        message: "Đơn đăng ký affiliate đã được gửi. Vui lòng chờ quản trị viên duyệt.",
      });
    } catch (error) {
      console.error("Error registering affiliate:", error);
      return res.status(500).json({
        error: "Failed to register affiliate",
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  if (req.method === "GET") {
    try {
      const { userId } = req.query;

      if (!userId || typeof userId !== "string") {
        return res.status(400).json({ error: "User ID is required" });
      }

      const affiliates = await getAffiliates();
      const affiliate = affiliates.find((a) => a.userId === userId);

      if (!affiliate) {
        return res.status(404).json({ error: "Affiliate not found" });
      }

      return res.status(200).json({
        success: true,
        affiliate,
      });
    } catch (error) {
      console.error("Error fetching affiliate:", error);
      return res.status(500).json({
        error: "Failed to fetch affiliate",
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}

