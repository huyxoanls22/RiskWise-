import type { Request, Response } from "express";
import { verifyAdminPin, rateLimit } from "./_security";

export default async function handler(req: Request, res: Response) {
  try {
    // Throttle to slow down PIN brute-force.
    if (!rateLimit(req, res, "verify-admin", 10, 60 * 1000)) {
      return res.status(429).json({ authorized: false, error: "Quá nhiều yêu cầu, vui lòng thử lại sau." });
    }

    const { pin } = req.body || {};
    if (!pin) {
      return res.status(400).json({ authorized: false, error: "Thiếu mã PIN đầu vào" });
    }

    if (verifyAdminPin(pin)) {
      return res.json({ authorized: true });
    }
    return res.status(401).json({ authorized: false, error: "Mã PIN xác thực không chính xác!" });
  } catch (err: any) {
    console.error("Lỗi xác minh mã PIN quản trị:", err);
    return res.status(500).json({ authorized: false, error: "Lỗi máy chủ nội bộ" });
  }
}
