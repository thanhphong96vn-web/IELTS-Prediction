import type { NextApiRequest, NextApiResponse } from "next";
import { readData, writeData } from "../../../lib/server/affiliate-data-helper";
import { decodeWordPressUserId } from "../../../lib/server/user-id-helper";
import { sendEmail } from "../../../lib/server/email-helper";
import dayjs from "dayjs";

const ORDERS_FILE = "orders.json";

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

interface SepayWebhookPayload {
  // Format mới từ Sepay
  gateway?: string; // "ACB"
  transactionDate?: string; // "2026-01-23 16:58:05"
  accountNumber?: string; // "2447967"
  subAccount?: string | null;
  code?: string | null;
  content?: string; // Nội dung chuyển khoản - chứa mã đơn hàng
  transferType?: string; // "in"
  description?: string;
  transferAmount?: number; // Số tiền (VND)
  referenceCode?: string;
  accumulated?: number;
  id?: number;
}

async function getOrders(): Promise<Order[]> {
  try {
    const data = await Promise.resolve(readData<Order[]>(ORDERS_FILE));
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

async function saveOrders(orders: Order[]): Promise<void> {
  await Promise.resolve(writeData<Order[]>(ORDERS_FILE, orders));
}

async function getOrderByTransferContent(transferContent: string): Promise<Order | null> {
  const orders = await getOrders();
  
  // Tìm exact match trước
  let order = orders.find((o) => 
    o.transferContent === transferContent || 
    o.orderId === transferContent
  );
  
  if (order) return order;
  
  // Nếu không tìm thấy, thử tìm với partial match
  // Ví dụ: "IELTS PREDICTION 17691622312585779" có thể match với orderId "IELTS PREDICTION 176916223125857791234"
  const normalizedSearch = transferContent.replace(/\s+/g, " ").trim();
  order = orders.find((o) => {
    const normalizedOrderId = o.orderId.replace(/\s+/g, " ").trim();
    const normalizedTransferContent = o.transferContent.replace(/\s+/g, " ").trim();
    
    return normalizedOrderId.includes(normalizedSearch) || 
           normalizedTransferContent.includes(normalizedSearch) ||
           normalizedSearch.includes(normalizedOrderId) ||
           normalizedSearch.includes(normalizedTransferContent);
  });
  
  return order || null;
}

/**
 * Tính toán ngày hết hạn Pro dựa trên duration (số tháng)
 * Nếu user đã có Pro và chưa hết hạn, cộng thêm vào ngày hết hạn hiện tại
 * Nếu user chưa có Pro hoặc đã hết hạn, tính từ ngày hiện tại
 */
/**
 * Tính ngày hết hạn Pro mới
 * Hỗ trợ nhiều format: "YYYY-MM-DD", "YYYYMMDD", hoặc dayjs object
 * 
 * @param currentExpirationDate - Ngày hết hạn hiện tại (có thể là null, "YYYY-MM-DD", hoặc "YYYYMMDD")
 * @param duration - Số tháng cần cộng thêm
 * @param isPro - User đã có Pro hay chưa (nếu true, sẽ cộng thêm vào ngày hiện tại nếu còn trong tương lai)
 * @returns Ngày hết hạn mới format "YYYY-MM-DD"
 */
function calculateProExpirationDate(
  currentExpirationDate: string | null | undefined, 
  duration: number,
  isPro: boolean = false
): string {
  const now = dayjs();
  let expirationDate: dayjs.Dayjs;

  // Nếu user đã có Pro và có ngày hết hạn
  if (isPro && currentExpirationDate) {
    let currentExp: dayjs.Dayjs;
    
    // Parse date từ nhiều format khác nhau
    if (currentExpirationDate.match(/^\d{8}$/)) {
      // Format ACF: "YYYYMMDD" (ví dụ: "20260131")
      currentExp = dayjs(currentExpirationDate, "YYYYMMDD");
    } else {
      // Format ISO: "YYYY-MM-DD" (ví dụ: "2026-01-31")
      currentExp = dayjs(currentExpirationDate);
    }

    // Nếu ngày hết hạn hiện tại còn trong tương lai, cộng thêm vào đó
    if (currentExp.isValid() && currentExp.isAfter(now)) {
      expirationDate = currentExp.add(duration, "month");
      console.log(`[Sepay Webhook] User đã có Pro, cộng thêm ${duration} tháng vào ngày hết hạn hiện tại: ${currentExp.format("YYYY-MM-DD")} → ${expirationDate.format("YYYY-MM-DD")}`);
    } else {
      // Nếu đã hết hạn hoặc không hợp lệ, tính từ ngày hiện tại
      expirationDate = now.add(duration, "month");
      console.log(`[Sepay Webhook] User đã có Pro nhưng ngày hết hạn đã qua hoặc không hợp lệ, tính từ ngày hiện tại: ${expirationDate.format("YYYY-MM-DD")}`);
    }
  } else if (currentExpirationDate) {
    // User chưa có Pro nhưng có ngày hết hạn (trường hợp edge case)
    let currentExp: dayjs.Dayjs;
    if (currentExpirationDate.match(/^\d{8}$/)) {
      currentExp = dayjs(currentExpirationDate, "YYYYMMDD");
    } else {
      currentExp = dayjs(currentExpirationDate);
    }

    if (currentExp.isValid() && currentExp.isAfter(now)) {
      expirationDate = currentExp.add(duration, "month");
    } else {
      expirationDate = now.add(duration, "month");
    }
  } else {
    // Chưa có Pro, tính từ ngày hiện tại
    expirationDate = now.add(duration, "month");
    console.log(`[Sepay Webhook] User chưa có Pro, tính từ ngày hiện tại: ${expirationDate.format("YYYY-MM-DD")}`);
  }

  return expirationDate.format("YYYY-MM-DD");
}

/**
 * Gửi email thông báo cho khách hàng
 */
async function sendCustomerEmail(
  customerEmail: string,
  customerName: string,
  orderId: string,
  amount: number,
  duration: number
): Promise<void> {
  try {
    const subject = `Thanh toán thành công - Đơn hàng ${orderId}`;
    const html = `
      <html lang="vi">
<head>
  <meta charset="UTF-8" />
  <title>Payment Receipt - IELTS Prediction Test</title>
</head>
<body style="margin:0; padding:0; background-color:#f4f6f8; font-family: Arial, Helvetica, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f6f8; padding:20px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius:8px; overflow:hidden;">
          
          <!-- Header -->
<tr>
  <td
    style="
      background-color:#c62828;
      background-image: linear-gradient(90deg, #c62828, #e53935, #ff5252);
      padding:20px;
      text-align:center;
    "
  >
    <h1 style="margin:0; color:#ffffff; font-size:22px;">
      IELTS Prediction Test
    </h1>
  </td>
</tr>

          <!-- Content -->
          <tr>
            <td style="padding:30px; color:#333333; font-size:15px; line-height:1.6;">
              <p style="margin-top:0;">
                Cảm ơn bạn đã thanh toán thành công!
              </p>

              <p>
                <strong>Thông tin đơn hàng:</strong>
              </p>

              <table width="100%" cellpadding="0" cellspacing="0" style="margin:15px 0; font-size:14px;">
                <tr>
                  <td style="padding:8px 0;">Mã đơn hàng:</td>
                  <td style="padding:8px 0; text-align:right;">
                    <strong>${orderId}</strong>
                  </td>
                </tr>
                <tr>
                  <td style="padding:8px 0;">Số tiền:</td>
                  <td style="padding:8px 0; text-align:right;">
                    <strong>${amount.toLocaleString("vi-VN")} VND</strong>
                  </td>
                </tr>
                <tr>
                  <td style="padding:8px 0;">Thời hạn Pro:</td>
                  <td style="padding:8px 0; text-align:right;">
                    <strong>${duration} tháng</strong>
                  </td>
                </tr>
              </table>

              <p>
                Tài khoản <strong>Pro</strong> của bạn đã được kích hoạt thành công.  
                Bạn có thể đăng nhập và bắt đầu làm bài dự đoán ngay.
              </p>

              <p style="margin-bottom:0;">
                Trân trọng,<br/>
                <strong>Đội ngũ IELTS Prediction</strong>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#f0f2f5; padding:15px; text-align:center; font-size:12px; color:#777777;">
              © 2026 IELTS Prediction. All rights reserved.
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    // Gửi email qua SMTP
    const emailSent = await sendEmail(customerEmail, subject, html);
    
    if (emailSent) {
      console.log(`[Sepay Webhook] Customer email sent successfully to ${customerEmail}`);
    } else {
      console.error(`[Sepay Webhook] Failed to send customer email to ${customerEmail}`);
    }
  } catch (error) {
    console.error("[Sepay Webhook] Error sending customer email:", error);
    // Không throw error để không làm gián đoạn quá trình xử lý
  }
}

/**
 * Gửi email thông báo cho admin
 */
async function sendAdminEmail(
  adminEmail: string,
  orderId: string,
  customerName: string,
  customerEmail: string,
  amount: number,
  duration: number
): Promise<void> {
  try {
    const subject = `[Admin] Thanh toán thành công - Đơn hàng ${orderId}`;
    const html = `
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <title>Payment Receipt - IELTS Prediction Test</title>
</head>
<body style="margin:0; padding:0; background-color:#f4f6f8; font-family: Arial, Helvetica, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f6f8; padding:20px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius:8px; overflow:hidden;">
          
          <!-- Header -->
<tr>
  <td
    style="
      background-color:#c62828;
      background-image: linear-gradient(90deg, #c62828, #e53935, #ff5252);
      padding:20px;
      text-align:center;
    "
  >
    <h1 style="margin:0; color:#ffffff; font-size:22px;">
      IELTS Prediction Test
    </h1>
  </td>
</tr>

          <!-- Content -->
          <tr>
            <td style="padding:30px; color:#333333; font-size:15px; line-height:1.6;">
              <p style="margin-top:0;">
                Xác nhận thanh toán thành công!
              </p>

              <p>
                <strong>Thông tin đơn hàng:</strong>
              </p>

              <table width="100%" cellpadding="0" cellspacing="0" style="margin:15px 0; font-size:14px;">
                <tr>
                  <td style="padding:8px 0;">Mã đơn hàng:</td>
                  <td style="padding:8px 0; text-align:right;">
                    <strong>${orderId}</strong>
                  </td>
                </tr>
                <tr>
                  <td style="padding:8px 0;">Số tiền:</td>
                  <td style="padding:8px 0; text-align:right;">
                    <strong>${amount.toLocaleString("vi-VN")} VND</strong>
                  </td>
                </tr>
                <tr>
                  <td style="padding:8px 0;">Thời hạn Pro:</td>
                  <td style="padding:8px 0; text-align:right;">
                    <strong>${duration} tháng</strong>
                  </td>
                </tr>
              </table>

              <p>
                Tài khoản <strong>Pro</strong> đã được kích hoạt tự động.  
              </p>

              <p style="margin-bottom:0;">
                Trân trọng,<br/>
                <strong>Đội ngũ IELTS Prediction</strong>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#f0f2f5; padding:15px; text-align:center; font-size:12px; color:#777777;">
              © 2026 IELTS Prediction. All rights reserved.
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    // Gửi email qua SMTP
    const emailSent = await sendEmail(adminEmail, subject, html);
    
    if (emailSent) {
      console.log(`[Sepay Webhook] Admin email sent successfully to ${adminEmail}`);
    } else {
      console.error(`[Sepay Webhook] Failed to send admin email to ${adminEmail}`);
    }
  } catch (error) {
    console.error("[Sepay Webhook] Error sending admin email:", error);
  }
}

/**
 * Cập nhật ProAccount cho user
 * Sử dụng WordPress REST API để update ACF fields
 */
async function updateUserProAccount(
  userId: string,
  duration: number,
): Promise<boolean> {
  try {
    // Decode GraphQL User ID thành WordPress numeric ID
    const wpUserId = decodeWordPressUserId(userId);
    if (!wpUserId) {
      console.error(`[Sepay Webhook] Invalid GraphQL User ID format: ${userId}`);
      return false;
    }

    console.log(`[Sepay Webhook] Decoded User ID: GraphQL ID "${userId}" → WordPress ID "${wpUserId}"`);

    // Sử dụng WordPress REST API để update ACF fields
    const wpUrl = process.env.NEXT_PUBLIC_WORDPRESS_CMS_URL;
    if (!wpUrl) {
      console.error("[Sepay Webhook] WordPress URL not configured");
      return false;
    }

    // Lấy WordPress admin token hoặc application password
    const wpAdminUser = process.env.WP_ADMIN_USER;
    const wpAdminPassword = process.env.WP_ADMIN_PASSWORD;
    
    if (!wpAdminUser || !wpAdminPassword) {
      console.error("[Sepay Webhook] WordPress admin credentials not configured");
      return false;
    }

    // Tạo Basic Auth header
    const basicAuth = Buffer.from(`${wpAdminUser}:${wpAdminPassword}`).toString("base64");

    // Fetch user data từ WordPress REST API để lấy ACF fields hiện tại
    let isPro = false;
    let currentExpirationDate: string | null = null;
    
    try {
      const getUserResponse = await fetch(`${wpUrl}/wp-json/wp/v2/users/${wpUserId}?context=edit`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Basic ${basicAuth}`,
        },
      });

      if (getUserResponse.ok) {
        const userData = await getUserResponse.json();
        
        // Lấy ACF fields từ WordPress REST API response
        if (userData.acf) {
          isPro = userData.acf.is_pro === true || userData.acf.is_pro === "1" || userData.acf.is_pro === 1;
          currentExpirationDate = userData.acf.pro_expiration_date || null;
          
          console.log(`[Sepay Webhook] Current user Pro status: is_pro = ${isPro}, pro_expiration_date = ${currentExpirationDate || "null"}`);
          
          if (isPro && currentExpirationDate) {
            console.log(`[Sepay Webhook] User đã có Pro, sẽ cộng thêm ${duration} tháng vào ngày hết hạn hiện tại`);
          } else if (!isPro) {
            console.log(`[Sepay Webhook] User chưa có Pro, sẽ kích hoạt Pro và tính từ ngày hiện tại`);
          }
        } else {
          console.log(`[Sepay Webhook] User không có ACF fields, sẽ tạo mới`);
        }
      } else {
        console.log(`[Sepay Webhook] Could not fetch user data from REST API (status: ${getUserResponse.status}), proceeding with update`);
      }
    } catch (fetchError) {
      console.log(`[Sepay Webhook] Error fetching user data from REST API:`, fetchError);
      // Tiếp tục xử lý với isPro = false và currentExpirationDate = null
    }

    // Tính ngày hết hạn mới (format: "YYYY-MM-DD")
    // Truyền isPro vào để hàm biết user đã có Pro hay chưa
    const newExpirationDateISO = calculateProExpirationDate(currentExpirationDate, duration, isPro);
    
    // Convert sang format ACF: "YYYYMMDD"
    const newExpirationDateACF = dayjs(newExpirationDateISO).format("YYYYMMDD");

    console.log(`[Sepay Webhook] Pro expiration date: ${newExpirationDateISO} (ISO) → ${newExpirationDateACF} (ACF format)`);

    // Update ACF fields qua WordPress REST API
    // WordPress REST API endpoint để update user ACF fields
    const response = await fetch(`${wpUrl}/wp-json/wp/v2/users/${wpUserId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${basicAuth}`,
      },
      body: JSON.stringify({
        acf: {
          is_pro: true, // Boolean, không phải string
          pro_expiration_date: newExpirationDateACF, // Format: "YYYYMMDD"
        },
      }),
    });

    if (response.ok) {
      const responseData = await response.json();
      console.log(`✓ Updated ProAccount via REST API for WordPress User ID ${wpUserId} (GraphQL ID: ${userId})`);
      console.log(`  - is_pro: true`);
      console.log(`  - pro_expiration_date: ${newExpirationDateACF}`);
      return true;
    } else {
      const errorText = await response.text();
      console.error(`[Sepay Webhook] Failed to update user via REST API: ${response.status} - ${errorText}`);
      console.error(`[Sepay Webhook] Request URL: ${wpUrl}/wp-json/wp/v2/users/${wpUserId}`);
      console.error(`[Sepay Webhook] Request body:`, JSON.stringify({
        acf: {
          is_pro: true,
          pro_expiration_date: newExpirationDateACF,
        },
      }, null, 2));
      
      // Fallback: Log để admin update thủ công
      console.log(`[MANUAL UPDATE REQUIRED] WordPress User ID: ${wpUserId} (GraphQL ID: ${userId}), is_pro: true, pro_expiration_date: ${newExpirationDateACF}`);
      return false;
    }
  } catch (error) {
    console.error("[Sepay Webhook] Error updating user ProAccount:", error);
    console.error("[Sepay Webhook] Error stack:", error instanceof Error ? error.stack : "No stack trace");
    return false;
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // API Key authentication (simple header check)
  const apiKeyHeader = req.headers["x-api-key"];
  const apiKey = Array.isArray(apiKeyHeader) ? apiKeyHeader[0] : apiKeyHeader;
  const expectedApiKey = "EAKHTNSZCLWQIEVL1TT5DVWOZ8JYLGHU2WCSMRWDBUDNGVSXPAY4AJZOODR06UBB";

  if (!apiKey || apiKey !== expectedApiKey) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  // Chỉ chấp nhận POST request
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Optional: Verify webhook signature từ Sepay (nếu có)
  const webhookSecret = process.env.SEPAY_WEBHOOK_SECRET;
  if (webhookSecret) {
    // TODO: Implement signature verification nếu Sepay cung cấp
    // const signature = req.headers["x-sepay-signature"];
    // if (!verifySignature(payload, signature, webhookSecret)) {
    //   return res.status(401).json({ error: "Invalid signature" });
    // }
  }

  try {
    // Parse webhook payload từ Sepay
    let payload: SepayWebhookPayload;
    try {
      payload = req.body;
      console.log(`[Sepay Webhook] Raw payload received:`, JSON.stringify(payload, null, 2));
    } catch (parseError) {
      console.error("[Sepay Webhook] Error parsing request body:", parseError);
      return res.status(400).json({
        error: "Invalid request body",
        message: parseError instanceof Error ? parseError.message : String(parseError),
      });
    }

    // Format mới từ Sepay
    const amount = Number(payload.transferAmount);
    const content = payload.content || "";
    
    // Validate payload
    if (!amount || !content) {
      return res.status(400).json({
        error: "Missing required fields: transferAmount or content",
        received: payload,
      });
    }

    // Parse orderId từ content
    // Format từ Sepay: "IELTS PREDICTION 17691622312585779 FT26023000837022 GD 6023IBT1k1SC2TUB 230126-16:58:03"
    // OrderId format: "IELTS PREDICTION {timestamp}{random}" (ví dụ: "IELTS PREDICTION 17691622312585779")
    // Cần extract phần "IELTS PREDICTION" + số liền sau đó (có thể có khoảng trắng)
    let orderId = "";
    
    // Tìm pattern "IELTS PREDICTION" + số (có thể có khoảng trắng)
    const orderIdPattern = /IELTS\s+PREDICTION\s+(\d+)/i;
    const match = content.match(orderIdPattern);
    
    if (match) {
      // Tìm toàn bộ phần từ "IELTS PREDICTION" đến hết số đầu tiên
      // Có thể là "IELTS PREDICTION 17691622312585779" hoặc "IELTS PREDICTION17691622312585779"
      const fullPattern = /IELTS\s+PREDICTION\s*\d+/i;
      const fullMatch = content.match(fullPattern);
      if (fullMatch) {
        orderId = fullMatch[0].replace(/\s+/g, " ").trim(); // Normalize spaces
      } else {
        // Fallback: tạo từ match group
        orderId = `IELTS PREDICTION ${match[1]}`;
      }
    } else {
      // Fallback: dùng toàn bộ content nếu không match pattern
      orderId = content.trim();
      console.warn(`[Sepay Webhook] Could not parse orderId from content, using full content: ${orderId}`);
    }

    console.log(`[Sepay Webhook] Parsed payment notification:`, {
      amount,
      orderId,
      originalContent: content,
      accountNumber: payload.accountNumber,
      gateway: payload.gateway,
      transactionDate: payload.transactionDate || new Date().toISOString(),
    });

    // Tìm order theo transferContent (orderId)
    // Thử tìm với orderId đầy đủ trước, nếu không tìm thấy thử tìm với phần đầu
    let order: Order | null = null;
    
    try {
      order = await getOrderByTransferContent(orderId);
      
      if (!order) {
        // Thử tìm với chỉ phần số (timestamp + random)
        const orderIdNumbers = orderId.replace("IELTS PREDICTION", "").trim();
        if (orderIdNumbers) {
          const orders = await getOrders();
          order = orders.find((o) => {
            // Tìm order có orderId chứa số này
            const oIdNumbers = o.orderId.replace("IELTS PREDICTION", "").trim();
            return oIdNumbers === orderIdNumbers || 
                   o.orderId.includes(orderIdNumbers) ||
                   o.transferContent.includes(orderIdNumbers);
          }) || null;
        }
      }
    } catch (orderError) {
      console.error(`[Sepay Webhook] Error finding order:`, orderError);
      return res.status(500).json({
        error: "Error finding order",
        message: orderError instanceof Error ? orderError.message : String(orderError),
        orderId,
      });
    }

    if (!order) {
      try {
        const allOrders = await getOrders();
        console.error(`[Sepay Webhook] Order not found:`, {
          searchedOrderId: orderId,
          allOrders: allOrders.map(o => ({ orderId: o.orderId, transferContent: o.transferContent, status: o.status })),
        });
      } catch (logError) {
        console.error(`[Sepay Webhook] Error getting orders for logging:`, logError);
      }
      
      return res.status(404).json({
        error: "Order not found",
        orderId,
        searchedContent: content,
      });
    }

    console.log(`[Sepay Webhook] Found order:`, {
      orderId: order.orderId,
      transferContent: order.transferContent,
      amount: order.amount,
      status: order.status,
      userId: order.userId,
    });

    // Kiểm tra order đã được xử lý chưa
    if (order.status === "completed") {
      console.log(`[Sepay Webhook] Order already completed: ${orderId}`);
      return res.status(200).json({
        success: true,
        message: "Order already processed",
        orderId,
      });
    }

    // Đối chiếu số tiền
    if (Math.abs(order.amount - amount) > 1000) {
      // Cho phép sai số 1000 VND (do làm tròn)
      console.error(`[Sepay Webhook] Amount mismatch:`, {
        expected: order.amount,
        received: amount,
        orderId,
      });
      return res.status(400).json({
        error: "Amount mismatch",
        expected: order.amount,
        received: amount,
      });
    }

    // Lấy thông tin user từ WordPress
    let userEmail: string | null = null;
    let userName: string | null = null;

    // Lấy user info từ WordPress REST API
    if ((!userEmail || !userName) && order.userId && !order.userId.startsWith("temp_")) {
      try {
        const wpUserId = decodeWordPressUserId(order.userId);
        if (wpUserId) {
          const wpUrl = process.env.NEXT_PUBLIC_WORDPRESS_CMS_URL;
          const wpAdminUser = process.env.WP_ADMIN_USER;
          const wpAdminPassword = process.env.WP_ADMIN_PASSWORD;

          if (wpUrl && wpAdminUser && wpAdminPassword) {
            const basicAuth = Buffer.from(`${wpAdminUser}:${wpAdminPassword}`).toString("base64");
            const getUserResponse = await fetch(`${wpUrl}/wp-json/wp/v2/users/${wpUserId}?context=edit`, {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Basic ${basicAuth}`,
              },
            });

            if (getUserResponse.ok) {
              const userData = await getUserResponse.json();
              userEmail = userData.email || userEmail;
              userName = userData.name || userName;
              console.log(`[Sepay Webhook] REST user email: ${userData.email || "null"}`);
              console.log(`[Sepay Webhook] REST user name: ${userData.name || "null"}`);
              console.log(`[Sepay Webhook] Fetched user info from REST API: ${userName} (${userEmail})`);
            } else {
              const errorText = await getUserResponse.text();
              console.warn(`[Sepay Webhook] REST user fetch failed: ${getUserResponse.status} - ${errorText}`);
            }
          }
        }
      } catch (restError) {
        console.error("[Sepay Webhook] Error fetching user info from REST API:", restError);
      }
    }

    // Cập nhật ProAccount cho user (nếu có userId hợp lệ)
    if (order.userId && !order.userId.startsWith("temp_")) {
      try {
        console.log(`[Sepay Webhook] Starting ProAccount update for user: ${order.userId}`);
        const updateSuccess = await updateUserProAccount(
          order.userId,
          order.duration
        );

        if (updateSuccess) {
          console.log(`[Sepay Webhook] ✓ ProAccount updated successfully for user: ${order.userId}`);
        } else {
          console.error(`[Sepay Webhook] ✗ Failed to update ProAccount for user: ${order.userId}`);
          // Vẫn tiếp tục xử lý, không fail toàn bộ request
        }
      } catch (updateError) {
        console.error(`[Sepay Webhook] Error updating ProAccount:`, updateError);
        // Vẫn tiếp tục xử lý, không fail toàn bộ request
      }
    } else {
      console.log(`[Sepay Webhook] Skipping ProAccount update: invalid userId (${order.userId})`);
    }

    // Gửi email thông báo cho khách hàng
    if (userEmail && userName) {
      try {
        console.log(`[Sepay Webhook] Sending customer email to: ${userEmail}`);
        await sendCustomerEmail(
          userEmail,
          userName,
          order.orderId,
          order.amount,
          order.duration
        );
        console.log(`[Sepay Webhook] ✓ Customer email sent successfully`);
      } catch (emailError) {
        console.error(`[Sepay Webhook] ✗ Error sending customer email:`, emailError);
      }
    } else {
      console.warn(`[Sepay Webhook] Skipping customer email: missing userEmail (${userEmail}) or userName (${userName})`);
      console.warn(`[Sepay Webhook] Debug userEmail length: ${userEmail?.length ?? 0}`);
      console.warn(`[Sepay Webhook] Debug userName length: ${userName?.length ?? 0}`);
    }

    // Gửi email thông báo cho admin
    try {
      const adminEmail = process.env.ADMIN_EMAIL || "admin@ieltspredictiontest.com";
      console.log(`[Sepay Webhook] Sending admin email to: ${adminEmail}`);
      await sendAdminEmail(
        adminEmail,
        order.orderId,
        userName || "Khách hàng",
        userEmail || "N/A",
        order.amount,
        order.duration
      );
      console.log(`[Sepay Webhook] ✓ Admin email sent successfully`);
    } catch (emailError) {
      console.error(`[Sepay Webhook] ✗ Error sending admin email:`, emailError);
      // Không fail request vì email không critical
    }

    // Cập nhật order status thành "completed"
    try {
      const orders = await getOrders();
      const orderIndex = orders.findIndex((o) => o.orderId === order.orderId);
      if (orderIndex >= 0) {
        const previousStatus = orders[orderIndex].status;
        orders[orderIndex].status = "completed";
        await saveOrders(orders);
        
        console.log(`[Sepay Webhook] ✓ Updated order status:`, {
          orderId: order.orderId,
          previousStatus,
          newStatus: "completed",
        });
      } else {
        console.error(`[Sepay Webhook] ⚠ Order not found in orders array to update status: ${order.orderId}`);
      }
    } catch (saveError) {
      console.error(`[Sepay Webhook] Error updating order status:`, saveError);
      // Vẫn trả về success vì các bước khác đã hoàn thành
      // Order status có thể được update thủ công sau
    }

    console.log(`[Sepay Webhook] ✓ Successfully processed order:`, {
      orderId: order.orderId,
      amount,
      userId: order.userId,
      status: "completed",
    });

    return res.status(200).json({
      success: true,
      message: "Payment processed successfully",
      orderId: order.orderId,
      status: "completed",
      amount,
    });
  } catch (error) {
    console.error("[Sepay Webhook] Error processing webhook:", error);
    console.error("[Sepay Webhook] Error stack:", error instanceof Error ? error.stack : "No stack trace");
    console.error("[Sepay Webhook] Request body:", JSON.stringify(req.body, null, 2));
    
    return res.status(500).json({
      error: "Internal server error",
      message: error instanceof Error ? error.message : String(error),
      // Chỉ log stack trace trong development
      ...(process.env.NODE_ENV === "development" && error instanceof Error && { stack: error.stack }),
    });
  }
}
