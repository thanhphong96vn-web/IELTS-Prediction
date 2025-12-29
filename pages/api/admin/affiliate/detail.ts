import type { NextApiRequest, NextApiResponse } from "next";
import { readData } from "../../../../lib/server/affiliate-data-helper";

const AFFILIATES_FILE = "affiliates.json";
const LINKS_FILE = "affiliate-links.json";
const COMMISSIONS_FILE = "affiliate-commissions.json";
const VISITS_FILE = "affiliate-visits.json";

async function getAffiliates(): Promise<any[]> {
  try {
    const result = readData<any[]>(AFFILIATES_FILE);
    const data = result instanceof Promise ? await result : result;
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Error getting affiliates:", error);
    return [];
  }
}

async function getLinks(): Promise<any[]> {
  try {
    const result = readData<any[]>(LINKS_FILE);
    const data = result instanceof Promise ? await result : result;
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Error getting links:", error);
    return [];
  }
}

async function getCommissions(): Promise<any[]> {
  try {
    const result = readData<any[]>(COMMISSIONS_FILE);
    const data = result instanceof Promise ? await result : result;
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Error getting commissions:", error);
    return [];
  }
}

async function getVisits(): Promise<any[]> {
  try {
    const result = readData<any[]>(VISITS_FILE);
    const data = result instanceof Promise ? await result : result;
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Error getting visits:", error);
    return [];
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { affiliateId } = req.query;

    if (!affiliateId || typeof affiliateId !== "string") {
      return res.status(400).json({ 
        success: false,
        error: "Affiliate ID is required" 
      });
    }

    const affiliates = await getAffiliates();
    const affiliate = affiliates.find((a: any) => a.id === affiliateId);

    if (!affiliate) {
      console.error("Affiliate not found. Requested ID:", affiliateId);
      return res.status(404).json({ 
        success: false,
        error: "Affiliate not found" 
      });
    }

    // Get all related data
    let links: any[] = [];
    let commissions: any[] = [];
    let visits: any[] = [];

    try {
      links = (await getLinks()).filter((l: any) => l.affiliateId === affiliateId);
    } catch (error) {
      console.error("Error fetching links:", error);
      links = [];
    }

    try {
      commissions = (await getCommissions()).filter((c: any) => c.affiliateId === affiliateId);
    } catch (error) {
      console.error("Error fetching commissions:", error);
      commissions = [];
    }

    try {
      visits = (await getVisits()).filter((v: any) => v.affiliateId === affiliateId);
    } catch (error) {
      console.error("Error fetching visits:", error);
      visits = [];
    }

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
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Error details:", {
      affiliateId: req.query.affiliateId,
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
    });
    return res.status(500).json({
      success: false,
      error: "Failed to fetch affiliate detail",
      message: errorMessage,
    });
  }
}

