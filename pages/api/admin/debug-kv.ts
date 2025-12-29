import type { NextApiRequest, NextApiResponse } from "next";
import { getKVClient } from "../../../lib/server/admin-config-helper";

/**
 * API endpoint để debug KV connection
 * GET /api/admin/debug-kv
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const kvUrl = process.env.KV_REST_API_URL;
    const kvToken = process.env.KV_REST_API_TOKEN;
    const isVercel = process.env.VERCEL === "1";
    const nodeEnv = process.env.NODE_ENV;

    const debugInfo = {
      environment: {
        isVercel: isVercel === "1",
        nodeEnv,
        hasKVUrl: !!kvUrl,
        hasKVToken: !!kvToken,
        kvUrlPrefix: kvUrl ? kvUrl.substring(0, 20) + "..." : null,
      },
      kvClient: null as any,
      testResult: null as any,
    };

    // Thử khởi tạo KV client
    try {
      const client = getKVClient();
      debugInfo.kvClient = {
        initialized: client !== null && client !== false,
        isNull: client === null,
        isFalse: client === false,
      };

      // Nếu client đã được khởi tạo, thử test connection
      if (client) {
        try {
          const testKey = "config:__test__";
          const testValue = JSON.stringify({ test: true, timestamp: Date.now() });
          
          // Test write
          await client.set(testKey, testValue);
          
          // Test read
          const readValue = await client.get(testKey);
          
          // Cleanup
          await client.del(testKey);

          debugInfo.testResult = {
            success: true,
            write: "OK",
            read: readValue ? "OK" : "FAILED",
            cleanup: "OK",
          };
        } catch (testError: any) {
          debugInfo.testResult = {
            success: false,
            error: testError?.message || String(testError),
          };
        }
      }
    } catch (clientError: any) {
      debugInfo.kvClient = {
        initialized: false,
        error: clientError?.message || String(clientError),
      };
    }

    return res.status(200).json({
      message: "KV Debug Info",
      ...debugInfo,
    });
  } catch (error: any) {
    return res.status(500).json({
      error: "Failed to get debug info",
      message: error?.message || String(error),
    });
  }
}

