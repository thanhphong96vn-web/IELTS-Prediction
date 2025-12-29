import type { NextApiRequest, NextApiResponse } from "next";
import { createServerApolloClient } from "@/shared/graphql";
import { gql } from "@apollo/client";
import { GetServerSidePropsContext } from "next";
import fs from "fs";
import path from "path";

const AFFILIATE_COOKIE_NAME = "affiliate_ref";
const COMMISSIONS_FILE = path.join(process.cwd(), "data", "affiliate-commissions.json");
const VISITS_FILE = path.join(process.cwd(), "data", "affiliate-visits.json");
const AFFILIATES_FILE = path.join(process.cwd(), "data", "affiliates.json");
const LINKS_FILE = path.join(process.cwd(), "data", "affiliate-links.json");

const CREATE_ORDER_MUTATION = gql`
  mutation CREATE_ORDER($input: CreateOrderInput!) {
    createOrder(input: $input) {
      order {
        id
        orderId
        orderFields {
          packageType
          duration
          skillType
          amount
          status
          paymentMethod
          transferContent
          createdAt
        }
      }
    }
  }
`;

const ORDERS_FILE = path.join(process.cwd(), "data", "orders.json");

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
  affiliateRef?: string; // Lưu affiliate ref để tính hoa hồng sau khi thanh toán thành công
}

function generateOrderId(): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
  return `IELTS PREDICTION ${timestamp}${random}`;
}

function generateTransferContent(orderId: string): string {
  return orderId;
}

function ensureOrdersFile() {
  const dir = path.dirname(ORDERS_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(ORDERS_FILE)) {
    fs.writeFileSync(ORDERS_FILE, JSON.stringify([], null, 2));
  }
}

function getOrders(): Order[] {
  ensureOrdersFile();
  try {
    const data = fs.readFileSync(ORDERS_FILE, "utf-8");
    return JSON.parse(data);
  } catch {
    return [];
  }
}

function saveOrder(order: Order): void {
  const orders = getOrders();
  orders.push(order);
  fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2));
}

function getOrderById(orderId: string): Order | null {
  const orders = getOrders();
  return orders.find((o) => o.orderId === orderId) || null;
}

// Helper functions for affiliate
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
    // Try to get affiliate ref from cookie if not provided
    let affiliateCode = affiliateRef;
    
    // If no affiliate code provided, skip
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
    // Don't throw error, just log it
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { packageType, duration, skillType, amount, userId } = req.body;

    if (!packageType || !duration || !amount) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Get userId from request body or try to get from auth context
    let finalUserId = userId;
    if (!finalUserId) {
      // Try to get from cookies/auth headers if available
      // For now, use a temporary ID if not provided
      finalUserId = `temp_${Date.now()}`;
    }

    // Get affiliate ref from cookie
    const affiliateRef = req.cookies[AFFILIATE_COOKIE_NAME];

    const orderId = generateOrderId();
    const transferContent = generateTransferContent(orderId);

    const order: Order = {
      id: `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      orderId,
      userId: finalUserId,
      packageType,
      duration,
      skillType: packageType === "single" ? skillType : undefined,
      amount,
      status: "pending",
      paymentMethod: "Ngân hàng VCB (Vietcombank)",
      transferContent,
      createdAt: new Date().toISOString(),
      affiliateRef: affiliateRef || undefined, // Lưu affiliate ref vào order
    };

    // Try GraphQL mutation first
    try {
      const { client, isSignedIn, getAuthHeaders } =
        createServerApolloClient(req as unknown as GetServerSidePropsContext);

      if (isSignedIn) {
        const { data } = await client.mutate({
          mutation: CREATE_ORDER_MUTATION,
          variables: {
            input: {
              packageType,
              duration,
              skillType,
              amount,
              status: "pending",
              paymentMethod: order.paymentMethod,
              transferContent,
            },
          },
          context: {
            headers: getAuthHeaders(),
            authRequired: true,
          },
        });

        if (data?.createOrder?.order) {
          return res.status(200).json({
            success: true,
            order: data.createOrder.order,
          });
        }
      }
    } catch (graphqlError) {
      console.log("GraphQL mutation failed, using file storage:", graphqlError);
    }

    // Fallback to file storage
    saveOrder(order);

    // KHÔNG tính hoa hồng affiliate ở đây
    // Hoa hồng chỉ được tính khi order status = "completed" (sau khi thanh toán thành công)
    // Xem API update order status để biết khi nào tính hoa hồng

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
    console.error("Error creating order:", error);
    return res.status(500).json({
      error: "Failed to create order",
      message: error instanceof Error ? error.message : String(error),
    });
  }
}

