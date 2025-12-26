import type { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";
import path from "path";

const AFFILIATES_FILE = path.join(process.cwd(), "data", "affiliates.json");

interface AffiliateUser {
  id: string;
  userId: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  approvedAt?: string;
  customLink?: string;
  emailNotifications: boolean;
}

function ensureAffiliatesFile() {
  const dir = path.dirname(AFFILIATES_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(AFFILIATES_FILE)) {
    fs.writeFileSync(AFFILIATES_FILE, JSON.stringify([], null, 2));
  }
}

function getAffiliates(): AffiliateUser[] {
  ensureAffiliatesFile();
  try {
    const data = fs.readFileSync(AFFILIATES_FILE, "utf-8");
    return JSON.parse(data);
  } catch {
    return [];
  }
}

function saveAffiliate(affiliate: AffiliateUser): void {
  const affiliates = getAffiliates();
  const existingIndex = affiliates.findIndex((a) => a.userId === affiliate.userId);
  
  if (existingIndex >= 0) {
    affiliates[existingIndex] = affiliate;
  } else {
    affiliates.push(affiliate);
  }
  
  fs.writeFileSync(AFFILIATES_FILE, JSON.stringify(affiliates, null, 2));
}

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "POST") {
    try {
      const { userId } = req.body;

      if (!userId) {
        return res.status(400).json({ error: "User ID is required" });
      }

      const affiliates = getAffiliates();
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

      saveAffiliate(newAffiliate);

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

      const affiliates = getAffiliates();
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

