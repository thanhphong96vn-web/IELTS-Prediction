// Server-only file - không được import ở client-side
// @ts-ignore - Next.js sẽ không bundle file này vào client
if (typeof window !== 'undefined') {
  throw new Error('File này chỉ có thể chạy ở server-side');
}

import fs from "fs";
import path from "path";

// Lazy load Vercel KV client
let kvClient: any = null;

/**
 * Khởi tạo Vercel KV client
 * Export để có thể dùng trong debug endpoint
 */
export function getKVClient() {
  if (kvClient !== null) {
    return kvClient;
  }

  const kvUrl = process.env.KV_REST_API_URL;
  const kvToken = process.env.KV_REST_API_TOKEN;

  if (kvUrl && kvToken) {
    try {
      // Sử dụng require vì Next.js hỗ trợ cả CommonJS và ESM
      const { createClient } = require("@vercel/kv");
      kvClient = createClient({
        url: kvUrl,
        token: kvToken,
      });
      return kvClient;
    } catch (error: any) {
      console.warn("Failed to initialize Vercel KV:", error?.message || error);
      console.warn("Error details:", error);
      kvClient = false;
      return null;
    }
  }

  kvClient = false;
  return null;
}

/**
 * Kiểm tra xem có nên sử dụng Vercel KV không
 */
function shouldUseKV(): boolean {
  const hasKVEnv = !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
  const isVercel = process.env.VERCEL === "1";
  const isProduction = process.env.NODE_ENV === "production";
  const kvClient = getKVClient();
  
  // Chỉ sử dụng KV nếu:
  // 1. Có KV environment variables
  // 2. Đang ở Vercel hoặc production
  // 3. KV client đã được khởi tạo thành công
  const shouldUse = hasKVEnv && (isVercel || isProduction) && kvClient !== null && kvClient !== false;
  
  if (isVercel && !shouldUse) {
    console.warn(`⚠ KV không được sử dụng. hasKVEnv: ${hasKVEnv}, isVercel: ${isVercel}, isProduction: ${isProduction}, kvClient: ${kvClient !== null && kvClient !== false}`);
  }
  
  return shouldUse;
}

/**
 * Lấy đường dẫn file config cho một section
 * sectionName có thể là "hero-banner" (cho home), "footer/cta-banner" (cho footer), hoặc "terms-of-use" (ở root)
 */
export function getConfigFilePath(sectionName: string): string {
  // Nếu sectionName chứa "/", dùng cấu trúc thư mục đó
  if (sectionName.includes("/")) {
    return path.join(process.cwd(), "config", `${sectionName}.json`);
  }
  
  // Thử tìm ở root của config trước
  const rootPath = path.join(process.cwd(), "config", `${sectionName}.json`);
  if (fs.existsSync && fs.existsSync(rootPath)) {
    return rootPath;
  }
  
  // Nếu không có ở root, mặc định là "home"
  return path.join(process.cwd(), "config", "home", `${sectionName}.json`);
}

/**
 * Lấy key cho Vercel KV từ sectionName
 */
function getKVKey(sectionName: string): string {
  return `config:${sectionName}`;
}

/**
 * Đọc config từ Vercel KV (async)
 */
async function readConfigFromKV<T>(sectionName: string): Promise<T> {
  const client = getKVClient();
  const key = getKVKey(sectionName);

  try {
    const value = await client.get(key);
    if (value === null) {
      // Config không tồn tại trong KV - đây là lỗi có thể recover được
      const error = new Error(`Config không tồn tại trong KV: ${sectionName}`);
      (error as any).isConfigNotFound = true;
      throw error;
    }
    return typeof value === "string" ? JSON.parse(value) : (value as T);
  } catch (error: any) {
    // Chỉ log warning nếu không phải lỗi config not found
    if (!error?.isConfigNotFound) {
      console.warn(`Failed to read from KV:`, error);
    }
    throw error;
  }
}

/**
 * Ghi config vào Vercel KV (async)
 */
async function writeConfigToKV<T>(sectionName: string, data: T): Promise<void> {
  const client = getKVClient();
  
  if (!client) {
    const error = new Error(
      `KV client không được khởi tạo. Kiểm tra KV_REST_API_URL và KV_REST_API_TOKEN environment variables.`
    );
    console.error(`Failed to write to KV: ${sectionName}`, error);
    throw error;
  }
  
  const key = getKVKey(sectionName);
  const value = JSON.stringify(data, null, 2);

  try {
    await client.set(key, value);
    console.log(`✓ Config saved to KV: ${sectionName}`);
  } catch (error: any) {
    const errorMessage = error?.message || String(error);
    const errorDetails = {
      sectionName,
      key,
      error: errorMessage,
      hasKVUrl: !!process.env.KV_REST_API_URL,
      hasKVToken: !!process.env.KV_REST_API_TOKEN,
      isVercel: process.env.VERCEL === "1",
      nodeEnv: process.env.NODE_ENV,
    };
    console.error(`❌ Failed to write to KV:`, errorDetails);
    throw new Error(`Không thể ghi vào KV: ${errorMessage}`);
  }
}

/**
 * Đọc config từ file JSON hoặc Vercel KV
 * Hỗ trợ cả sync (filesystem) và async (KV)
 */
export function readConfig<T>(sectionName: string): T;
export async function readConfig<T>(sectionName: string): Promise<T>;
export function readConfig<T>(sectionName: string): T | Promise<T> {
  // Nếu có Vercel KV và đang ở production, sử dụng nó (async)
  if (shouldUseKV()) {
    return readConfigFromKV<T>(sectionName).catch(async (error: any) => {
      // Nếu không có trong KV, thử fallback về filesystem
      // Trên Vercel, files trong repo vẫn có thể đọc được (read-only)
      if (error?.isConfigNotFound || error?.message?.includes('không tồn tại trong KV')) {
        try {
          const fsConfig = readConfigFromFileSystem<T>(sectionName);
          console.log(`⚠ Config "${sectionName}" not found in KV, using filesystem fallback`);
          
          // Tự động migrate config vào KV để lần sau không cần fallback
          // Chạy async trong background, không block response
          Promise.resolve(writeConfig(sectionName, fsConfig)).catch((migrateError) => {
            console.warn(`Failed to auto-migrate "${sectionName}" to KV:`, migrateError);
          });
          
          return fsConfig;
        } catch (fsError: any) {
          // Nếu cả hai đều fail, throw error từ KV nhưng với message rõ ràng hơn
          const finalError = new Error(
            `Config "${sectionName}" không tồn tại trong cả KV và filesystem. ` +
            `Hãy gọi POST /api/admin/migrate-configs để migrate configs hoặc tạo config trong admin panel.`
          );
          console.error(`❌ Failed to read config "${sectionName}" from both KV and filesystem`);
          throw finalError;
        }
      }
      // Nếu là lỗi khác (không phải config not found), throw ngay
      throw error;
    });
  }

  // Sử dụng filesystem cho localhost (sync)
  return readConfigFromFileSystem<T>(sectionName);
}

/**
 * Đọc config từ filesystem (helper function)
 * Export để có thể dùng trong migration script
 */
export function readConfigFromFileSystem<T>(sectionName: string): T {
  const filePath = getConfigFilePath(sectionName);
  
  if (!fs.existsSync(filePath)) {
    throw new Error(`File config không tồn tại: ${filePath}`);
  }
  
  const raw = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(raw) as T;
}

/**
 * Ghi config vào file JSON hoặc Vercel KV
 * Hỗ trợ cả sync (filesystem) và async (KV)
 */
export function writeConfig<T>(sectionName: string, data: T): void;
export async function writeConfig<T>(sectionName: string, data: T): Promise<void>;
export function writeConfig<T>(sectionName: string, data: T): void | Promise<void> {
  // Nếu có Vercel KV và đang ở production, sử dụng nó (async)
  if (shouldUseKV()) {
    return writeConfigToKV<T>(sectionName, data).catch((error) => {
      // Nếu KV fail, fallback về filesystem (nhưng chỉ trên localhost)
      if (process.env.VERCEL !== "1") {
        console.warn("KV write failed, falling back to filesystem:", error);
        writeConfigToFileSystem(sectionName, data);
        return;
      }
      // Trên Vercel, throw error vì không thể ghi filesystem
      throw error;
    });
  }

  // Sử dụng filesystem cho localhost (sync)
  return writeConfigToFileSystem(sectionName, data);
}

/**
 * Ghi config vào filesystem (helper function)
 */
function writeConfigToFileSystem<T>(sectionName: string, data: T): void {
  const filePath = getConfigFilePath(sectionName);
  const dir = path.dirname(filePath);
  
  // Đảm bảo thư mục tồn tại
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
}
