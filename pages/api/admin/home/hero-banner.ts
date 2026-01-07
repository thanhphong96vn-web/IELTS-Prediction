import type { NextApiRequest, NextApiResponse } from "next";
import { readConfig, writeConfig } from "../../../../lib/server/admin-config-helper";
import type { HeroBannerConfig } from "@/shared/types/admin-config";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const sectionName = "hero-banner";

  if (req.method === "GET") {
    try {
      const config = await Promise.resolve(readConfig<HeroBannerConfig>(sectionName));
      
      // Helper function để validate và clean URL
      const isValidImageUrl = (url: string): boolean => {
        if (!url || !url.trim()) return false;
        // Loại bỏ các đường dẫn fakepath (local file paths)
        if (url.includes('fakepath') || url.includes('C:\\') || url.includes('C:/')) {
          return false;
        }
        // Chấp nhận URL external hoặc relative path hợp lệ
        return url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/');
      };

      // Clean invalid URLs từ config khi đọc
      const cleanConfig = (config: any): any => {
        if (typeof config !== 'object' || config === null) return config;
        
        if (Array.isArray(config)) {
          return config.map(item => cleanConfig(item));
        }
        
        const cleaned: any = {};
        for (const [key, value] of Object.entries(config)) {
          if (typeof value === 'string' && (key === 'image' || key === 'icon' || key === 'backgroundImage' || key === 'bannerImage' || key.includes('avatar') || key.includes('Avatar'))) {
            // Nếu là URL không hợp lệ, xóa nó
            if (!isValidImageUrl(value)) {
              console.warn(`Removing invalid URL from ${key}:`, value);
              cleaned[key] = '';
            } else {
              cleaned[key] = value;
            }
          } else if (Array.isArray(value) && (key === 'avatars' || key.includes('avatar'))) {
            // Clean avatar arrays
            cleaned[key] = value.filter((item: any) => {
              if (typeof item === 'string') {
                return isValidImageUrl(item);
              }
              return true;
            }).map((item: any) => cleanConfig(item));
          } else {
            cleaned[key] = cleanConfig(value);
          }
        }
        return cleaned;
      };

      const cleanedConfig = cleanConfig(config) as HeroBannerConfig;
      
      // Tự động lưu lại config đã clean nếu có thay đổi
      const originalStr = JSON.stringify(config);
      const cleanedStr = JSON.stringify(cleanedConfig);
      if (originalStr !== cleanedStr) {
        console.log("Auto-cleaning invalid URLs from config and saving...");
        await Promise.resolve(writeConfig<HeroBannerConfig>(sectionName, cleanedConfig));
      }
      
      return res.status(200).json(cleanedConfig);
    } catch (error) {
      return res.status(500).json({
        message: "Không đọc được file config",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  if (req.method === "POST") {
    try {
      // TODO: Thêm authentication check ở đây
      // if (!isAdmin(req)) return res.status(401).json({ message: "Unauthorized" });

      const body = req.body as HeroBannerConfig;
      
      // Helper function để validate và clean URL
      const isValidImageUrl = (url: string): boolean => {
        if (!url || !url.trim()) return false;
        // Loại bỏ các đường dẫn fakepath (local file paths)
        if (url.includes('fakepath') || url.includes('C:\\') || url.includes('C:/')) {
          return false;
        }
        // Chấp nhận URL external hoặc relative path hợp lệ
        return url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/');
      };

      // Clean invalid URLs từ config
      const cleanConfig = (config: any): any => {
        if (typeof config !== 'object' || config === null) return config;
        
        if (Array.isArray(config)) {
          return config.map(item => cleanConfig(item));
        }
        
        const cleaned: any = {};
        for (const [key, value] of Object.entries(config)) {
          if (typeof value === 'string' && (key === 'image' || key === 'icon' || key === 'backgroundImage' || key === 'bannerImage' || key.includes('avatar') || key.includes('Avatar'))) {
            // Nếu là URL không hợp lệ, xóa nó
            if (!isValidImageUrl(value)) {
              console.warn(`Removing invalid URL from ${key}:`, value);
              cleaned[key] = '';
            } else {
              cleaned[key] = value;
            }
          } else if (Array.isArray(value) && (key === 'avatars' || key.includes('avatar'))) {
            // Clean avatar arrays
            cleaned[key] = value.filter((item: any) => {
              if (typeof item === 'string') {
                return isValidImageUrl(item);
              }
              return true;
            }).map((item: any) => cleanConfig(item));
          } else {
            cleaned[key] = cleanConfig(value);
          }
        }
        return cleaned;
      };

      const cleanedBody = cleanConfig(body) as HeroBannerConfig;
      await Promise.resolve(writeConfig<HeroBannerConfig>(sectionName, cleanedBody));
      return res.status(200).json({ message: "Lưu config thành công" });
    } catch (error) {
      return res.status(500).json({
        message: "Không ghi được file config",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return res.status(405).json({ message: "Method not allowed" });
}
