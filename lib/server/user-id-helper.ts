// Server-only file - không được import ở client-side
if (typeof window !== 'undefined') {
  throw new Error('File này chỉ có thể chạy ở server-side');
}

/**
 * Decode WordPress GraphQL User ID từ base64 format
 * WordPress GraphQL sử dụng Global ID format: base64("user:1076")
 * 
 * @param graphqlUserId - GraphQL ID dạng base64 (ví dụ: "dXNlcjoxMDc2")
 * @returns WordPress User ID (ví dụ: "1076") hoặc null nếu không hợp lệ
 */
export function decodeWordPressUserId(graphqlUserId: string): string | null {
  try {
    // Decode base64
    const decoded = Buffer.from(graphqlUserId, "base64").toString("utf-8");
    
    // Format: "user:1076"
    const parts = decoded.split(":");
    
    if (parts.length === 2 && parts[0] === "user") {
      return parts[1];
    }
    
    return null;
  } catch (error) {
    console.error("Error decoding WordPress User ID:", error);
    return null;
  }
}

/**
 * Encode WordPress User ID thành GraphQL ID format
 * 
 * @param wpUserId - WordPress User ID (ví dụ: "1076")
 * @returns GraphQL ID dạng base64 (ví dụ: "dXNlcjoxMDc2")
 */
export function encodeWordPressUserId(wpUserId: string): string {
  const encoded = Buffer.from(`user:${wpUserId}`).toString("base64");
  return encoded;
}

/**
 * Kiểm tra xem một string có phải là GraphQL User ID không
 * 
 * @param id - ID cần kiểm tra
 * @returns true nếu là GraphQL ID format
 */
export function isGraphQLUserId(id: string): boolean {
  try {
    const decoded = Buffer.from(id, "base64").toString("utf-8");
    return decoded.startsWith("user:");
  } catch {
    return false;
  }
}
