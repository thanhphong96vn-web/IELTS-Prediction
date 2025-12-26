import type { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";
import path from "path";

const ORDERS_FILE = path.join(process.cwd(), "data", "orders.json");
const AFFILIATE_COOKIE_NAME = "affiliate_ref";
const COMMISSIONS_FILE = path.join(process.cwd(), "data", "affiliate-commissions.json");
const VISITS_FILE = path.join(process.cwd(), "data", "affiliate-visits.json");
const AFFILIATES_FILE = path.join(process.cwd(), "data", "affiliates.json");
const LINKS_FILE = path.join(process.cwd(), "data", "affiliate-links.json");

interface Order {
  id: string;
  orderId: string;
  userId: string;
  packageType: "combo" | "single";
  duration: number;
  skillType?: "listening" | "reading";
  amount: number;
  status: "pending" | "completed" | "cancelled";
  paymentMethod: string;
  transferContent: string;
  createdAt: string;
  affiliateRef?: string;
}

function getOrders(): Order[] {
  try {
    if (!fs.existsSync(ORDERS_FILE)) {
      return [];
    }
    const data = fs.readFileSync(ORDERS_FILE, "utf-8");
    return JSON.parse(data);
  } catch {
    return [];
  }
}

function saveOrders(orders: Order[]): void {
  fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2));
}

// Helper functions for affiliate (copy from create.ts)
function getAffiliates(): any[] {
  try {
    if (!fs.existsSync(AFFILIATES_FILE)) return [];
    const data = fs.readFileSync(AFFILIATES_FILE, "utf-8");
    return JSON.parse(data);
  } catch {
    return [];
  }
}

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

function resolveAffiliateCode(code: string): { affiliateId: string; linkId: string } | null {
  const affiliates = getAffiliates();
  const links = getLinks();

  let affiliate = affiliates.find(
    (a: any) => a.customLink === code || a.id.substring(0, 8) === code
  );

  if (!affiliate) {
    const link = links.find((l: any) => l.customLink === code);
    if (link) {
      affiliate = affiliates.find((a: any) => a.id === link.affiliateId);
    }
  }

  if (!affiliate || affiliate.status !== "approved") {
    return null;
  }

  let link = links.find((l: any) => l.affiliateId === affiliate.id);
  if (!link) {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const affiliateCode = affiliate.customLink || affiliate.id.substring(0, 8);
    const defaultLink = {
      id: `link_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      affiliateId: affiliate.id,
      customLink: affiliate.customLink,
      createdAt: new Date().toISOString(),
    };
    links.push(defaultLink);
    fs.writeFileSync(LINKS_FILE, JSON.stringify(links, null, 2));
    link = defaultLink;
  }

  return { affiliateId: affiliate.id, linkId: link.id };
}

async function handleAffiliateCommission(
  userId: string,
  orderId: string,
  amount: number,
  affiliateRef?: string
) {
  try {
    let affiliateCode = affiliateRef;
    
    if (!affiliateCode) {
      return;
    }

    const resolved = resolveAffiliateCode(affiliateCode);
    if (!resolved) {
      return;
    }

    const { affiliateId, linkId } = resolved;

    // Check if commission already exists
    const commissions = getCommissions();
    const existing = commissions.find(
      (c: any) => c.orderId === orderId && c.affiliateId === affiliateId
    );

    if (existing) {
      return;
    }

    // Create commission (20% of order amount)
    const COMMISSION_RATE = 0.2;
    const commissionAmount = Math.round(amount * COMMISSION_RATE);

    const commission = {
      id: `commission_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      affiliateId,
      orderId,
      amount,
      commissionRate: COMMISSION_RATE,
      commissionAmount,
      status: "pending",
      createdAt: new Date().toISOString(),
    };

    commissions.push(commission);
    fs.writeFileSync(COMMISSIONS_FILE, JSON.stringify(commissions, null, 2));

    // Update visit to converted
    const visits = getVisits();
    const visitIndex = visits.findIndex(
      (v: any) => v.affiliateId === affiliateId && v.linkId === linkId && !v.converted
    );

    if (visitIndex >= 0) {
      visits[visitIndex].converted = true;
      visits[visitIndex].orderId = orderId;
      fs.writeFileSync(VISITS_FILE, JSON.stringify(visits, null, 2));
    }
  } catch (error) {
    console.error("Error handling affiliate commission:", error);
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "GET") {
    try {
      const { orderId } = req.query;

      if (!orderId || typeof orderId !== "string") {
        return res.status(400).json({ error: "Order ID is required" });
      }

      const orders = getOrders();
      const order = orders.find((o) => o.orderId === orderId);

      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }

      return res.status(200).json({
        success: true,
        order: {
          id: order.id,
          orderId: order.orderId,
          orderFields: {
            packageType: order.packageType,
            duration: order.duration,
            skillType: order.skillType,
            amount: order.amount,
            status: order.status,
            paymentMethod: order.paymentMethod,
            transferContent: order.transferContent,
            createdAt: order.createdAt,
          },
        },
      });
    } catch (error) {
      console.error("Error fetching order:", error);
      return res.status(500).json({
        error: "Failed to fetch order",
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  if (req.method === "PUT" || req.method === "PATCH") {
    try {
      const { orderId } = req.query;
      const { status } = req.body;

      if (!orderId || typeof orderId !== "string") {
        return res.status(400).json({ error: "Order ID is required" });
      }

      if (!status || !["pending", "completed", "cancelled"].includes(status)) {
        return res.status(400).json({ error: "Valid status is required" });
      }

      const orders = getOrders();
      const orderIndex = orders.findIndex((o) => o.orderId === orderId);

      if (orderIndex === -1) {
        return res.status(404).json({ error: "Order not found" });
      }

      const order = orders[orderIndex];
      const previousStatus = order.status;

      // Update order status
      order.status = status as "pending" | "completed" | "cancelled";
      saveOrders(orders);

      // CHỈ tính hoa hồng affiliate khi order status chuyển từ "pending" sang "completed"
      // và order có affiliateRef
      if (
        previousStatus === "pending" &&
        status === "completed" &&
        order.affiliateRef
      ) {
        await handleAffiliateCommission(
          order.userId,
          order.orderId,
          order.amount,
          order.affiliateRef
        );
      }

      return res.status(200).json({
        success: true,
        order: {
          id: order.id,
          orderId: order.orderId,
          orderFields: {
            packageType: order.packageType,
            duration: order.duration,
            skillType: order.skillType,
            amount: order.amount,
            status: order.status,
            paymentMethod: order.paymentMethod,
            transferContent: order.transferContent,
            createdAt: order.createdAt,
          },
        },
      });
    } catch (error) {
      console.error("Error updating order:", error);
      return res.status(500).json({
        error: "Failed to update order",
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}

