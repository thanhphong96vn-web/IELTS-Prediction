// Server-only file - không được import ở client-side
// @ts-ignore - Next.js sẽ không bundle file này vào client
if (typeof window !== 'undefined') {
  throw new Error('File này chỉ có thể chạy ở server-side');
}

import fs from "fs";
import path from "path";

/**
 * Lấy đường dẫn file config cho một section
 * sectionName có thể là "hero-banner" (cho home) hoặc "footer/cta-banner" (cho footer)
 */
export function getConfigFilePath(sectionName: string): string {
  // Nếu sectionName chứa "/", dùng cấu trúc thư mục đó
  if (sectionName.includes("/")) {
    return path.join(process.cwd(), "config", `${sectionName}.json`);
  }
  // Mặc định là "home"
  return path.join(process.cwd(), "config", "home", `${sectionName}.json`);
}

/**
 * Đọc config từ file JSON
 */
export function readConfig<T>(sectionName: string): T {
  const filePath = getConfigFilePath(sectionName);
  
  if (!fs.existsSync(filePath)) {
    throw new Error(`File config không tồn tại: ${filePath}`);
  }
  
  const raw = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(raw) as T;
}

/**
 * Ghi config vào file JSON
 */
export function writeConfig<T>(sectionName: string, data: T): void {
  const filePath = getConfigFilePath(sectionName);
  const dir = path.dirname(filePath);
  
  // Đảm bảo thư mục tồn tại
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
}
