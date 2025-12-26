import type { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";
import path from "path";

const VISITS_FILE = path.join(process.cwd(), "data", "affiliate-visits.json");

interface AffiliateVisit {
  id: string;
  affiliateId: string;
  linkId: string;
  ipAddress?: string;
  userAgent?: string;
  referer?: string;
  visitedAt: string;
  converted: boolean;
  orderId?: string;
}

function ensureFile() {
  const dir = path.dirname(VISITS_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(VISITS_FILE)) {
    fs.writeFileSync(VISITS_FILE, JSON.stringify([], null, 2));
  }
}

function getVisits(): AffiliateVisit[] {
  ensureFile();
  try {
    const data = fs.readFileSync(VISITS_FILE, "utf-8");
    return JSON.parse(data);
  } catch {
    return [];
  }
}

function saveVisit(visit: AffiliateVisit): void {
  const visits = getVisits();
  visits.push(visit);
  fs.writeFileSync(VISITS_FILE, JSON.stringify(visits, null, 2));
}

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "POST") {
    try {
      const { affiliateId, linkId, ipAddress, userAgent, referer } = req.body;

      if (!affiliateId || !linkId) {
        return res.status(400).json({ error: "Affiliate ID and Link ID are required" });
      }

      const visit: AffiliateVisit = {
        id: `visit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        affiliateId,
        linkId,
        ipAddress,
        userAgent,
        referer,
        visitedAt: new Date().toISOString(),
        converted: false,
      };

      saveVisit(visit);

      return res.status(200).json({
        success: true,
        visit,
      });
    } catch (error) {
      console.error("Error recording visit:", error);
      return res.status(500).json({
        error: "Failed to record visit",
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

      const visits = getVisits();
      const affiliateVisits = visits.filter((v) => v.affiliateId === affiliateId);

      return res.status(200).json({
        success: true,
        visits: affiliateVisits,
      });
    } catch (error) {
      console.error("Error fetching visits:", error);
      return res.status(500).json({
        error: "Failed to fetch visits",
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}

