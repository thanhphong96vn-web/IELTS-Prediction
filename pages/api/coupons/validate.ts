import type { NextApiRequest, NextApiResponse } from "next";
import { readData } from "../../../lib/server/affiliate-data-helper";
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
    const { code } = req.body;

    if (!code || typeof code !== "string") {
      return res.status(400).json({
        valid: false,
        message: "Vui lòng nhập mã giảm giá",
      });
    }

    const coupons = await Promise.resolve(readData<Coupon[]>(COUPONS_FILE));
    const coupon = coupons.find(
      (c) => c.code.toUpperCase() === code.toUpperCase() && c.isActive
    );

    if (!coupon) {
      return res.status(200).json({
        valid: false,
        message: "Mã giảm giá không hợp lệ hoặc đã hết hạn",
      });
    }

    if (coupon.currentUses >= coupon.maxUses) {
      return res.status(200).json({
        valid: false,
        message: "Mã giảm giá đã hết lượt sử dụng",
      });
    }

    return res.status(200).json({
      valid: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        discountAmount: coupon.discountAmount,
      },
      message: "Mã giảm giá hợp lệ",
    });
  } catch (error) {
    return res.status(500).json({
      valid: false,
      message: "Có lỗi xảy ra khi kiểm tra mã giảm giá",
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
