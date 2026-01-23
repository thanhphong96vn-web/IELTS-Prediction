import type { NextApiRequest, NextApiResponse } from "next";
import { readData, writeData } from "../../../lib/server/affiliate-data-helper";

const AFFILIATE_LINKS_FILE = "affiliate-links.json";
const AFFILIATES_FILE = "affiliates.json";

interface AffiliateLink {
  id: string;
  affiliateId: string;
  link: string;
  customLink?: string;
  createdAt: string;
}

interface AffiliateUser {
  id: string;
  userId: string;
  status: "pending" | "approved" | "rejected";
  customLink?: string;
}

async function getAffiliates(): Promise<AffiliateUser[]> {
  try {
    const data = await Promise.resolve(readData<AffiliateUser[]>(AFFILIATES_FILE));
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

async function getLinks(): Promise<AffiliateLink[]> {
  try {
    const data = await Promise.resolve(readData<AffiliateLink[]>(AFFILIATE_LINKS_FILE));
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

async function saveLink(link: AffiliateLink): Promise<void> {
  const links = await getLinks();
  const existingIndex = links.findIndex((l) => l.id === link.id);
  
  if (existingIndex >= 0) {
    links[existingIndex] = link;
  } else {
    links.push(link);
  }
  
  try {
    await Promise.resolve(writeData<AffiliateLink[]>(AFFILIATE_LINKS_FILE, links));
    console.log(`✓ Link saved successfully:`, link.id);
  } catch (error) {
    console.error("Error writing link:", error);
    throw error;
  }
}

function generateRandomCode(length: number = 8): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function generateAffiliateCode(affiliateId: string, customLink?: string): string {
  if (customLink && customLink.trim()) {
    return customLink.trim();
  }
  // Generate a random code if no customLink provided
  return generateRandomCode(10);
}

function getBaseUrl(req?: NextApiRequest): string {
  if (req) {
    const protocol = req.headers['x-forwarded-proto'] || (req.headers.referer?.startsWith('https') ? 'https' : 'http');
    const host = req.headers.host || req.headers['x-forwarded-host'];
    
    if (host) {
      return `${protocol}://${host}`;
    }
  }
  
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL;
  }
  
  return "http://localhost:3000";
}

function generateAffiliateLink(affiliateId: string, customLink?: string, req?: NextApiRequest): string {
  const baseUrl = getBaseUrl(req);
  const affiliateCode = generateAffiliateCode(affiliateId, customLink);
  return `${baseUrl}/subscription?ref=${affiliateCode}`;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "POST") {
    try {
      const { affiliateId, customLink } = req.body;

      if (!affiliateId) {
        return res.status(400).json({ error: "Affiliate ID is required" });
      }

      // Check if affiliate is approved
      const affiliates = await getAffiliates();
      const affiliate = affiliates.find((a) => a.id === affiliateId);

      if (!affiliate) {
        return res.status(404).json({ error: "Affiliate not found" });
      }

      if (affiliate.status !== "approved") {
        return res.status(403).json({ 
          error: "Affiliate not approved",
          message: "Bạn cần được duyệt trước khi tạo link affiliate"
        });
      }

      // Generate customLink if not provided
      const finalCustomLink = customLink && customLink.trim() 
        ? customLink.trim() 
        : generateRandomCode(10);

      // Check if link already exists for this affiliate with the same customLink
      const existingLinks = await getLinks();
      const existingLink = existingLinks.find(
        (l) => l.affiliateId === affiliateId && l.customLink === finalCustomLink
      );

      // If link with this customLink already exists, return it
      if (existingLink) {
        return res.status(200).json({
          success: true,
          link: existingLink,
          message: "Link đã tồn tại",
        });
      }

      const affiliateCode = generateAffiliateCode(affiliateId, finalCustomLink);
      const link = generateAffiliateLink(affiliateId, finalCustomLink, req);

      const newLink: AffiliateLink = {
        id: `link_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        affiliateId,
        link,
        customLink: finalCustomLink,
        createdAt: new Date().toISOString(),
      };

      try {
        await saveLink(newLink);
        console.log("Link saved successfully:", newLink.id);
      } catch (error) {
        console.error("Error saving link:", error);
        return res.status(500).json({
          error: "Failed to save link",
          message: error instanceof Error ? error.message : String(error),
        });
      }

      // Note: We don't update affiliate.customLink here because each link can have its own customLink
      // The affiliate.customLink is only used for the default link generation in GET request

      return res.status(200).json({
        success: true,
        link: newLink,
        message: "Link created successfully",
      });
    } catch (error) {
      console.error("Error creating affiliate link:", error);
      return res.status(500).json({
        error: "Failed to create affiliate link",
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

      const links = await getLinks();
      let affiliateLinks = links.filter((l) => l.affiliateId === affiliateId);

      // If no links exist, create default one (only once)
      if (affiliateLinks.length === 0) {
        const affiliates = await getAffiliates();
        const affiliate = affiliates.find((a) => a.id === affiliateId);
        
        if (affiliate && affiliate.status === "approved") {
          const affiliateCode = generateAffiliateCode(affiliateId, affiliate.customLink);
          const defaultLink = generateAffiliateLink(affiliateId, affiliate.customLink, req);
          const newLink: AffiliateLink = {
            id: `link_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            affiliateId,
            link: defaultLink,
            customLink: affiliate.customLink,
            createdAt: new Date().toISOString(),
          };
          await saveLink(newLink);
          affiliateLinks = [newLink];
        }
      }

      // Remove duplicates - keep only the first link for each affiliate
      const uniqueLinks = affiliateLinks.reduce((acc: AffiliateLink[], link: AffiliateLink) => {
        // Check if we already have a link with the same affiliateId
        if (!acc.find(l => l.affiliateId === link.affiliateId && l.customLink === link.customLink)) {
          acc.push(link);
        }
        return acc;
      }, []);

      // Normalize links: update old localhost links to use current domain
      const baseUrl = getBaseUrl(req);
      const normalizedLinks = await Promise.all(
        uniqueLinks.map(async (link) => {
          if (link.link.includes('localhost:3000') || link.link.includes('http://localhost')) {
            const urlMatch = link.link.match(/ref=([^&]+)/);
            const affiliateCode = urlMatch ? urlMatch[1] : (link.customLink || '');
            if (affiliateCode) {
              const updatedLink = {
                ...link,
                link: `${baseUrl}/subscription?ref=${affiliateCode}`,
              };
              // Update in database
              try {
                await saveLink(updatedLink);
              } catch (error) {
                console.error('Error updating link:', error);
              }
              return updatedLink;
            }
          }
          return link;
        })
      );

      return res.status(200).json({
        success: true,
        links: normalizedLinks,
      });
    } catch (error) {
      console.error("Error fetching affiliate links:", error);
      return res.status(500).json({
        error: "Failed to fetch affiliate links",
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}


