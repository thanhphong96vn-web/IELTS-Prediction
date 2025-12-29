import type { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";
import path from "path";

const AFFILIATES_FILE = path.join(process.cwd(), "data", "affiliates.json");
const LINKS_FILE = path.join(process.cwd(), "data", "affiliate-links.json");
const COMMISSIONS_FILE = path.join(process.cwd(), "data", "affiliate-commissions.json");
const VISITS_FILE = path.join(process.cwd(), "data", "affiliate-visits.json");

function ensureFile(filePath: string) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify([], null, 2));
  }
}

function getAffiliates(): any[] {
  ensureFile(AFFILIATES_FILE);
  try {
    const data = fs.readFileSync(AFFILIATES_FILE, "utf-8");
    return JSON.parse(data);
  } catch {
    return [];
  }
}

function getLinks(): any[] {
  ensureFile(LINKS_FILE);
  try {
    const data = fs.readFileSync(LINKS_FILE, "utf-8");
    return JSON.parse(data);
  } catch {
    return [];
  }
}

function getCommissions(): any[] {
  ensureFile(COMMISSIONS_FILE);
  try {
    const data = fs.readFileSync(COMMISSIONS_FILE, "utf-8");
    return JSON.parse(data);
  } catch {
    return [];
  }
}

function getVisits(): any[] {
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

    const affiliates = getAffiliates();
    const affiliate = affiliates.find((a: any) => a.id === affiliateId);

    if (!affiliate) {
      return res.status(404).json({ error: "Affiliate not found" });
    }

    // Get all related data
    const links = getLinks().filter((l: any) => l.affiliateId === affiliateId);
    const commissions = getCommissions().filter((c: any) => c.affiliateId === affiliateId);
    const visits = getVisits().filter((v: any) => v.affiliateId === affiliateId);

    // Calculate stats
    const totalCommissions = commissions.reduce(
      (sum: number, c: any) => sum + c.commissionAmount,
      0
    );
    const pendingCommissions = commissions
      .filter((c: any) => c.status === "pending")
      .reduce((sum: number, c: any) => sum + c.commissionAmount, 0);
    const paidCommissions = commissions
      .filter((c: any) => c.status === "paid")
      .reduce((sum: number, c: any) => sum + c.commissionAmount, 0);
    const totalVisits = visits.length;
    const totalConversions = visits.filter((v: any) => v.converted).length;
    const conversionRate =
      totalVisits > 0 ? (totalConversions / totalVisits) * 100 : 0;

    return res.status(200).json({
      success: true,
      affiliate: {
        ...affiliate,
        stats: {
          totalLinks: Array.isArray(links) ? links.length : 0,
          totalVisits: Array.isArray(visits) ? visits.length : 0,
          totalConversions: Array.isArray(visits) ? visits.filter((v: any) => v.converted).length : 0,
          conversionRate: Math.round(conversionRate * 100) / 100,
          totalCommissions,
          pendingCommissions,
          paidCommissions,
        },
      },
      links: Array.isArray(links) ? links : [],
      commissions: Array.isArray(commissions) ? commissions.slice(0, 10) : [],
      visits: Array.isArray(visits) ? visits.slice(0, 10) : [],
    });
  } catch (error) {
    console.error("Error fetching affiliate detail:", error);
    return res.status(500).json({
      error: "Failed to fetch affiliate detail",
      message: error instanceof Error ? error.message : String(error),
    });
  }
}

