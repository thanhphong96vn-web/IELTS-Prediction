import type { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";
import path from "path";

const AFFILIATES_FILE = path.join(process.cwd(), "data", "affiliates.json");
const LINKS_FILE = path.join(process.cwd(), "data", "affiliate-links.json");

interface AffiliateUser {
  id: string;
  userId: string;
  status: "pending" | "approved" | "rejected";
  customLink?: string;
}

interface AffiliateLink {
  id: string;
  affiliateId: string;
  customLink?: string;
}

function getAffiliates(): AffiliateUser[] {
  try {
    if (!fs.existsSync(AFFILIATES_FILE)) return [];
    const data = fs.readFileSync(AFFILIATES_FILE, "utf-8");
    return JSON.parse(data);
  } catch {
    return [];
  }
}

function getLinks(): AffiliateLink[] {
  try {
    if (!fs.existsSync(LINKS_FILE)) return [];
    const data = fs.readFileSync(LINKS_FILE, "utf-8");
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
    const { code } = req.query;

    if (!code || typeof code !== "string") {
      return res.status(400).json({ error: "Affiliate code is required" });
    }

    const affiliates = getAffiliates();
    const links = getLinks();

    // Find affiliate by custom link first
    let affiliate = affiliates.find((a) => a.customLink === code);

    if (!affiliate) {
      // Try to find by link customLink
      const link = links.find((l) => l.customLink === code);
      if (link) {
        affiliate = affiliates.find((a) => a.id === link.affiliateId);
      }
    }

    if (!affiliate) {
      // Try to match by affiliate ID parts (timestamp_random)
      // Code format: "1766595750044_c0ttkxjle" matches affiliate_1766595750044_c0ttkxjle
      affiliate = affiliates.find((a) => {
        const parts = a.id.split('_');
        if (parts.length >= 3) {
          const idPart = parts.slice(1).join('_');
          return idPart === code;
        }
        return false;
      });
    }

    if (!affiliate || affiliate.status !== "approved") {
      return res.status(404).json({ error: "Affiliate not found or not approved" });
    }

    // Find existing link (don't create new one here, let links API handle it)
    let link = links.find((l) => l.affiliateId === affiliate!.id && 
      (affiliate.customLink ? l.customLink === affiliate.customLink : !l.customLink)
    );
    
    // If no link exists, we'll need to create one via the links API
    // But for now, return the affiliateId and let the frontend handle link creation
    if (!link) {
      // Return a temporary linkId - the frontend should create the link via POST /api/affiliate/links
      return res.status(200).json({
        success: true,
        affiliateId: affiliate.id,
        linkId: `temp_${affiliate.id}`,
        needsLinkCreation: true,
      });
    }

    return res.status(200).json({
      success: true,
      affiliateId: affiliate.id,
      linkId: link.id,
    });
  } catch (error) {
    console.error("Error resolving affiliate:", error);
    return res.status(500).json({
      error: "Failed to resolve affiliate",
      message: error instanceof Error ? error.message : String(error),
    });
  }
}

