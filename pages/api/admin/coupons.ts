import type { NextApiRequest, NextApiResponse } from "next";
import { readData, writeData } from "../../../lib/server/affiliate-data-helper";

export interface Coupon {
  id: string;
  code: string;
  discountAmount: number;
  maxUses: number;
  currentUses: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const COUPONS_FILE = "coupons.json";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "GET") {
    try {
      const coupons = await Promise.resolve(readData<Coupon[]>(COUPONS_FILE));
      return res.status(200).json(coupons);
    } catch (error) {
      return res.status(500).json({
        message: "Không đọc được danh sách mã giảm giá",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  if (req.method === "POST") {
    try {
      const { code, discountAmount, maxUses } = req.body;

      if (!code || !discountAmount || !maxUses) {
        return res.status(400).json({
          message: "Thiếu thông tin: code, discountAmount, maxUses là bắt buộc",
        });
      }

      const coupons = await Promise.resolve(readData<Coupon[]>(COUPONS_FILE));
      
      const existingCoupon = coupons.find(
        (c) => c.code.toUpperCase() === code.toUpperCase()
      );
      if (existingCoupon) {
        return res.status(400).json({
          message: "Mã giảm giá đã tồn tại",
        });
      }

      const newCoupon: Coupon = {
        id: `coupon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        code: code.toUpperCase(),
        discountAmount: Number(discountAmount),
        maxUses: Number(maxUses),
        currentUses: 0,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      coupons.push(newCoupon);
      await Promise.resolve(writeData<Coupon[]>(COUPONS_FILE, coupons));

      return res.status(200).json({ message: "Tạo mã giảm giá thành công", coupon: newCoupon });
    } catch (error) {
      return res.status(500).json({
        message: "Không thể tạo mã giảm giá",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  if (req.method === "PUT") {
    try {
      const { id, code, discountAmount, maxUses, isActive } = req.body;

      if (!id) {
        return res.status(400).json({ message: "Thiếu id" });
      }

      const coupons = await Promise.resolve(readData<Coupon[]>(COUPONS_FILE));
      const index = coupons.findIndex((c) => c.id === id);

      if (index === -1) {
        return res.status(404).json({ message: "Không tìm thấy mã giảm giá" });
      }

      if (code) {
        const existingCoupon = coupons.find(
          (c) => c.code.toUpperCase() === code.toUpperCase() && c.id !== id
        );
        if (existingCoupon) {
          return res.status(400).json({
            message: "Mã giảm giá đã tồn tại",
          });
        }
        coupons[index].code = code.toUpperCase();
      }

      if (discountAmount !== undefined) {
        coupons[index].discountAmount = Number(discountAmount);
      }

      if (maxUses !== undefined) {
        coupons[index].maxUses = Number(maxUses);
      }

      if (isActive !== undefined) {
        coupons[index].isActive = Boolean(isActive);
      }

      coupons[index].updatedAt = new Date().toISOString();

      await Promise.resolve(writeData<Coupon[]>(COUPONS_FILE, coupons));

      return res.status(200).json({ message: "Cập nhật thành công", coupon: coupons[index] });
    } catch (error) {
      return res.status(500).json({
        message: "Không thể cập nhật mã giảm giá",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  if (req.method === "DELETE") {
    try {
      const { id } = req.query;

      if (!id || typeof id !== "string") {
        return res.status(400).json({ message: "Thiếu id" });
      }

      const coupons = await Promise.resolve(readData<Coupon[]>(COUPONS_FILE));
      const filtered = coupons.filter((c) => c.id !== id);

      if (filtered.length === coupons.length) {
        return res.status(404).json({ message: "Không tìm thấy mã giảm giá" });
      }

      await Promise.resolve(writeData<Coupon[]>(COUPONS_FILE, filtered));

      return res.status(200).json({ message: "Xóa thành công" });
    } catch (error) {
      return res.status(500).json({
        message: "Không thể xóa mã giảm giá",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return res.status(405).json({ message: "Method not allowed" });
}
