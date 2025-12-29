import type { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";
import path from "path";

const COMMISSIONS_FILE = path.join(process.cwd(), "data", "affiliate-commissions.json");

interface AffiliateCommission {
  id: string;
  affiliateId: string;
  orderId: string;
  amount: number;
  commissionRate: number;
  commissionAmount: number;
  status: "pending" | "paid" | "cancelled";
  createdAt: string;
  paidAt?: string;
}

// Commission rate: 20% of order amount
const COMMISSION_RATE = 0.2;

function ensureFile() {
  const dir = path.dirname(COMMISSIONS_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(COMMISSIONS_FILE)) {
    fs.writeFileSync(COMMISSIONS_FILE, JSON.stringify([], null, 2));
  }
}

function getCommissions(): AffiliateCommission[] {
  ensureFile();
  try {
    const data = fs.readFileSync(COMMISSIONS_FILE, "utf-8");
    return JSON.parse(data);
  } catch {
    return [];
  }
}

function saveCommission(commission: AffiliateCommission): void {
  const commissions = getCommissions();
  commissions.push(commission);
  fs.writeFileSync(COMMISSIONS_FILE, JSON.stringify(commissions, null, 2));
}

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "POST") {
    try {
      const { affiliateId, orderId, amount } = req.body;

      if (!affiliateId || !orderId || !amount) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Check if commission already exists for this order
      const commissions = getCommissions();
      const existing = commissions.find(
        (c) => c.orderId === orderId && c.affiliateId === affiliateId
      );

      if (existing) {
        return res.status(200).json({
          success: true,
          commission: existing,
          message: "Commission already exists for this order",
        });
      }

      const commissionAmount = Math.round(amount * COMMISSION_RATE);

      const commission: AffiliateCommission = {
        id: `commission_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        affiliateId,
        orderId,
        amount,
        commissionRate: COMMISSION_RATE,
        commissionAmount,
        status: "pending",
        createdAt: new Date().toISOString(),
      };

      saveCommission(commission);

      return res.status(200).json({
        success: true,
        commission,
      });
    } catch (error) {
      console.error("Error creating commission:", error);
      return res.status(500).json({
        error: "Failed to create commission",
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  if (req.method === "GET") {
    try {
      const { affiliateId } = req.query;

      if (!affiliateId || typeof affiliateId !== "string") {
        return res.status(400).json({ error: "Affiliate ID is required" });
      }

      const commissions = getCommissions();
      const affiliateCommissions = commissions.filter(
        (c) => c.affiliateId === affiliateId
      );

      return res.status(200).json({
        success: true,
        commissions: affiliateCommissions,
      });
    } catch (error) {
      console.error("Error fetching commissions:", error);
      return res.status(500).json({
        error: "Failed to fetch commissions",
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}

