import type { NextApiRequest, NextApiResponse } from "next";
import { readData, writeData } from "../../../lib/server/affiliate-data-helper";
import type { Coupon } from "../admin/coupons";

const COUPONS_FILE = "coupons.json";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const { couponId } = req.body;

    if (!couponId) {
      return res.status(400).json({
        success: false,
        message: "Thiếu couponId",
      });
    }

    const coupons = await Promise.resolve(readData<Coupon[]>(COUPONS_FILE));
    const coupon = coupons.find((c) => c.id === couponId);

    if (!coupon || !coupon.isActive) {
      return res.status(400).json({
        success: false,
        message: "Mã giảm giá không hợp lệ",
      });
    }

    if (coupon.currentUses >= coupon.maxUses) {
      return res.status(400).json({
        success: false,
        message: "Mã giảm giá đã hết lượt sử dụng",
      });
    }

    coupon.currentUses += 1;
    coupon.updatedAt = new Date().toISOString();

    await Promise.resolve(writeData<Coupon[]>(COUPONS_FILE, coupons));

    return res.status(200).json({
      success: true,
      message: "Áp dụng mã giảm giá thành công",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Có lỗi xảy ra khi áp dụng mã giảm giá",
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
