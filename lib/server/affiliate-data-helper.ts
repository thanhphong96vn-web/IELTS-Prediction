// Server-only file - không được import ở client-side
if (typeof window !== 'undefined') {
  throw new Error('File này chỉ có thể chạy ở server-side');
}

import fs from "fs";
import path from "path";

// Lazy load Vercel KV client
let kvClient: any = null;

/**
 * Khởi tạo Vercel KV client
 */
function getKVClient() {
  if (kvClient !== null) {
    return kvClient;
  }

  const kvUrl = process.env.KV_REST_API_URL;
  const kvToken = process.env.KV_REST_API_TOKEN;

  if (kvUrl && kvToken) {
    try {
      const { createClient } = require("@vercel/kv");
      kvClient = createClient({
        url: kvUrl,
        token: kvToken,
      });
      return kvClient;
    } catch (error: any) {
      console.warn("Failed to initialize Vercel KV:", error?.message || error);
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
  
  return hasKVEnv && (isVercel || isProduction) && kvClient !== null && kvClient !== false;
}

/**
 * Lấy đường dẫn file data
 */
function getDataFilePath(fileName: string): string {
  return path.join(process.cwd(), "data", fileName);
}

/**
 * Lấy key cho Vercel KV
 */
function getKVKey(fileName: string): string {
  return `data:${fileName}`;
}

/**
 * Đọc data từ Vercel KV
 */
async function readDataFromKV<T>(fileName: string): Promise<T> {
  const client = getKVClient();
  
  if (!client) {
    throw new Error(`KV client không được khởi tạo cho file: ${fileName}`);
  }
  
  const key = getKVKey(fileName);

  try {
    const value = await client.get(key);
    if (value === null) {
      // Trả về array rỗng nếu không có data
      return [] as T;
    }
    return typeof value === "string" ? JSON.parse(value) : (value as T);
  } catch (error: any) {
    console.error(`Failed to read from KV: ${fileName}`, error);
    throw error;
  }
}

/**
 * Ghi data vào Vercel KV
 */
async function writeDataToKV<T>(fileName: string, data: T): Promise<void> {
  const client = getKVClient();
  
  if (!client) {
    const error = new Error(
      `KV client không được khởi tạo. Kiểm tra KV_REST_API_URL và KV_REST_API_TOKEN environment variables.`
    );
    console.error(`Failed to write to KV: ${fileName}`, error);
    throw error;
  }
  
  const key = getKVKey(fileName);
  const value = JSON.stringify(data, null, 2);

  try {
    await client.set(key, value);
    console.log(`✓ Data saved to KV: ${fileName}`);
  } catch (error: any) {
    const errorMessage = error?.message || String(error);
    console.error(`❌ Failed to write to KV: ${fileName}`, errorMessage);
    throw new Error(`Không thể ghi vào KV: ${errorMessage}`);
  }
}

/**
 * Đọc data từ filesystem
 */
function readDataFromFileSystem<T>(fileName: string): T {
  const filePath = getDataFilePath(fileName);
  
  if (!fs.existsSync(filePath)) {
    // Trả về array rỗng nếu file không tồn tại
    return [] as T;
  }
  
  const raw = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(raw) as T;
}

/**
 * Ghi data vào filesystem
 */
function writeDataToFileSystem<T>(fileName: string, data: T): void {
  const filePath = getDataFilePath(fileName);
  const dir = path.dirname(filePath);
  
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
}

/**
 * Đọc data từ file hoặc KV
 */
export function readData<T>(fileName: string): T;
export async function readData<T>(fileName: string): Promise<T>;
export function readData<T>(fileName: string): T | Promise<T> {
  if (shouldUseKV()) {
    return readDataFromKV<T>(fileName).catch(async (error: any) => {
      // Fallback về filesystem nếu KV fail
      try {
        const fsData = readDataFromFileSystem<T>(fileName);
        console.log(`⚠ Data "${fileName}" not found in KV, using filesystem fallback`);
        
        // Tự động migrate data vào KV để lần sau không cần fallback
        // Chạy async trong background, không block response
        if (Array.isArray(fsData) && fsData.length > 0) {
          Promise.resolve(writeData(fileName, fsData)).catch((migrateError) => {
            console.warn(`Failed to auto-migrate "${fileName}" to KV:`, migrateError);
          });
        }
        
        return fsData;
      } catch (fsError: any) {
        // Nếu cả hai đều fail, trả về empty array
        console.error(`❌ Failed to read data "${fileName}" from both KV and filesystem`);
        return [] as T;
      }
    });
  }

  return readDataFromFileSystem<T>(fileName);
}

/**
 * Ghi data vào file hoặc KV
 */
export function writeData<T>(fileName: string, data: T): void;
export async function writeData<T>(fileName: string, data: T): Promise<void>;
export function writeData<T>(fileName: string, data: T): void | Promise<void> {
  if (shouldUseKV()) {
    return writeDataToKV<T>(fileName, data).catch((error) => {
      // Nếu KV fail, fallback về filesystem (nhưng chỉ trên localhost)
      if (process.env.VERCEL !== "1") {
        console.warn("KV write failed, falling back to filesystem:", error);
        writeDataToFileSystem(fileName, data);
        return;
      }
      // Trên Vercel, throw error vì không thể ghi filesystem
      throw error;
    });
  }

  return writeDataToFileSystem(fileName, data);
}

