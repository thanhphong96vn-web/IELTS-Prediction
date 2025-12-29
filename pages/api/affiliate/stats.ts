import type { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";
import path from "path";

const COMMISSIONS_FILE = path.join(process.cwd(), "data", "affiliate-commissions.json");
const VISITS_FILE = path.join(process.cwd(), "data", "affiliate-visits.json");

interface AffiliateCommission {
  id: string;
  affiliateId: string;
  orderId: string;
  amount: number;
  commissionRate: number;
  commissionAmount: number;
  status: "pending" | "paid" | "cancelled";
  createdAt: string;
}

interface AffiliateVisit {
  id: string;
  affiliateId: string;
  linkId: string;
  visitedAt: string;
  converted: boolean;
  orderId?: string;
}

function ensureFile(filePath: string) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify([], null, 2));
  }
}

function getCommissions(): AffiliateCommission[] {
  ensureFile(COMMISSIONS_FILE);
  try {
    const data = fs.readFileSync(COMMISSIONS_FILE, "utf-8");
    return JSON.parse(data);
  } catch {
    return [];
  }
}

function getVisits(): AffiliateVisit[] {
  ensureFile(VISITS_FILE);
  try {
    const data = fs.readFileSync(VISITS_FILE, "utf-8");
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { affiliateId } = req.query;

    if (!affiliateId || typeof affiliateId !== "string") {
      return res.status(400).json({ error: "Affiliate ID is required" });
    }

    const commissions = getCommissions();
    const visits = getVisits();

    const affiliateCommissions = commissions.filter((c) => c.affiliateId === affiliateId);
    const affiliateVisits = visits.filter((v) => v.affiliateId === affiliateId);

    const totalCommissions = affiliateCommissions.reduce(
      (sum, c) => sum + c.commissionAmount,
      0
    );
    const pendingCommissions = affiliateCommissions
      .filter((c) => c.status === "pending")
      .reduce((sum, c) => sum + c.commissionAmount, 0);
    const paidCommissions = affiliateCommissions
      .filter((c) => c.status === "paid")
      .reduce((sum, c) => sum + c.commissionAmount, 0);
    const totalVisits = affiliateVisits.length;
    const totalConversions = affiliateVisits.filter((v) => v.converted).length;
    const conversionRate =
      totalVisits > 0 ? (totalConversions / totalVisits) * 100 : 0;

    return res.status(200).json({
      success: true,
      stats: {
        totalBalance: pendingCommissions,
        totalCommissions,
        totalVisits,
        totalConversions,
        conversionRate: Math.round(conversionRate * 100) / 100,
        pendingCommissions,
        paidCommissions,
      },
    });
  } catch (error) {
    console.error("Error fetching affiliate stats:", error);
    return res.status(500).json({
      error: "Failed to fetch affiliate stats",
      message: error instanceof Error ? error.message : String(error),
    });
  }
}

