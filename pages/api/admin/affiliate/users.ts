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
  rejectedAt?: string;
  customLink?: string;
  emailNotifications: boolean;
}

function ensureFile() {
  const dir = path.dirname(AFFILIATES_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(AFFILIATES_FILE)) {
    fs.writeFileSync(AFFILIATES_FILE, JSON.stringify([], null, 2));
  }
}

function getAffiliates(): AffiliateUser[] {
  ensureFile();
  try {
    const data = fs.readFileSync(AFFILIATES_FILE, "utf-8");
    return JSON.parse(data);
  } catch {
    return [];
  }
}

function saveAffiliates(affiliates: AffiliateUser[]): void {
  ensureFile();
  fs.writeFileSync(AFFILIATES_FILE, JSON.stringify(affiliates, null, 2));
}

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "GET") {
    try {
      const affiliates = getAffiliates();
      
      // Get stats for each affiliate
      const LINKS_FILE = path.join(process.cwd(), "data", "affiliate-links.json");
      const COMMISSIONS_FILE = path.join(process.cwd(), "data", "affiliate-commissions.json");
      const VISITS_FILE = path.join(process.cwd(), "data", "affiliate-visits.json");

      function getLinks(): any[] {
        try {
          if (!fs.existsSync(LINKS_FILE)) return [];
          const data = fs.readFileSync(LINKS_FILE, "utf-8");
          return JSON.parse(data);
        } catch {
          return [];
        }
      }

      function getCommissions(): any[] {
        try {
          if (!fs.existsSync(COMMISSIONS_FILE)) return [];
          const data = fs.readFileSync(COMMISSIONS_FILE, "utf-8");
          return JSON.parse(data);
        } catch {
          return [];
        }
      }

      function getVisits(): any[] {
        try {
          if (!fs.existsSync(VISITS_FILE)) return [];
          const data = fs.readFileSync(VISITS_FILE, "utf-8");
          return JSON.parse(data);
        } catch {
          return [];
        }
      }

      const allLinks = getLinks();
      const allCommissions = getCommissions();
      const allVisits = getVisits();

      // Enrich affiliates with stats
      const affiliatesWithStats = affiliates.map((affiliate: AffiliateUser) => {
        const links = allLinks.filter((l: any) => l.affiliateId === affiliate.id);
        const commissions = allCommissions.filter((c: any) => c.affiliateId === affiliate.id);
        const visits = allVisits.filter((v: any) => v.affiliateId === affiliate.id);

        const totalCommissions = commissions.reduce(
          (sum: number, c: any) => sum + c.commissionAmount,
          0
        );
        const pendingCommissions = commissions
          .filter((c: any) => c.status === "pending")
          .reduce((sum: number, c: any) => sum + c.commissionAmount, 0);
        const totalVisits = visits.length;
        const totalConversions = visits.filter((v: any) => v.converted).length;

        return {
          ...affiliate,
          stats: {
            totalLinks: links.length,
            totalVisits,
            totalConversions,
            totalCommissions,
            pendingCommissions,
          },
        };
      });

      return res.status(200).json({
        success: true,
        affiliates: affiliatesWithStats,
      });
    } catch (error) {
      console.error("Error fetching affiliates:", error);
      return res.status(500).json({
        error: "Failed to fetch affiliates",
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  if (req.method === "POST") {
    try {
      const { action, affiliateId, status, customLink } = req.body;

      if (!action || !affiliateId) {
        return res.status(400).json({ error: "Action and affiliate ID are required" });
      }

      const affiliates = getAffiliates();
      const affiliateIndex = affiliates.findIndex((a) => a.id === affiliateId);

      if (affiliateIndex === -1) {
        return res.status(404).json({ error: "Affiliate not found" });
      }

      const affiliate = affiliates[affiliateIndex];

      if (action === "approve") {
        affiliate.status = "approved";
        affiliate.approvedAt = new Date().toISOString();
        if (customLink) {
          affiliate.customLink = customLink;
        }
      } else if (action === "reject") {
        affiliate.status = "rejected";
        affiliate.rejectedAt = new Date().toISOString();
      } else if (action === "update") {
        if (status) affiliate.status = status;
        if (customLink !== undefined) affiliate.customLink = customLink;
      }

      affiliates[affiliateIndex] = affiliate;
      saveAffiliates(affiliates);

      return res.status(200).json({
        success: true,
        affiliate,
        message: `Affiliate ${action === "approve" ? "approved" : action === "reject" ? "rejected" : "updated"} successfully`,
      });
    } catch (error) {
      console.error("Error updating affiliate:", error);
      return res.status(500).json({
        error: "Failed to update affiliate",
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}

