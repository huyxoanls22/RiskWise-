import type { Request, Response } from "express";
import { verifyAdminPin, signLicensePayload, rateLimit } from "./_security";

const base64Encode = (str: string): string => {
  return Buffer.from(str, "utf-8").toString("base64");
};

export default async function handler(req: Request, res: Response) {
  try {
    // Throttle to slow down PIN brute-force / mass key minting.
    if (!rateLimit(req, res, "license-generate", 10, 60 * 1000)) {
      return res.status(429).json({ success: false, error: "Quá nhiều yêu cầu, vui lòng thử lại sau." });
    }

    const { pin, email, prefix } = req.body || {};

    // 1. Authenticate with PIN
    if (!pin) {
      return res.status(400).json({ success: false, error: "Thiếu mã PIN quản trị viên" });
    }

    if (!verifyAdminPin(pin)) {
      return res.status(401).json({ success: false, error: "Mã PIN xác thực sai, từ chối tạo mã!" });
    }

    // 2. Validate Email
    const cleanEmail = (email || '').trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      return res.status(400).json({ success: false, error: "Email khách hàng không hợp lệ!" });
    }

    // 3. Determine Expiration Date
    const validPrefixes = ["RW-MTH-", "RW-YEAR-", "RW5-MTH-", "RW10-YEAR-", "RWP-"];
    const safePrefix = validPrefixes.includes(prefix) ? prefix : "RW-MTH-";

    let daysToAdd = 30;
    if (safePrefix.includes("YEAR")) {
      daysToAdd = 365;
    }

    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + daysToAdd);

    const yyyy = expiryDate.getFullYear();
    const mm = String(expiryDate.getMonth() + 1).padStart(2, '0');
    const dd = String(expiryDate.getDate()).padStart(2, '0');
    const targetExpiryStr = `${yyyy}-${mm}-${dd}`;

    // 4. Generate License Key Structure (HMAC-SHA256 signed, server-only secret)
    const payloadStr = `${cleanEmail}:${targetExpiryStr}`;
    const encodedPayload = base64Encode(payloadStr);
    const signature = signLicensePayload(payloadStr);
    const finalLicenseKey = `${safePrefix}${encodedPayload}-${signature}`;

    return res.json({
      success: true,
      key: finalLicenseKey,
      email: cleanEmail,
      expiryDate: targetExpiryStr,
      prefix: safePrefix
    });

  } catch (err: any) {
    console.error("Lỗi tạo License key trên server:", err);
    return res.status(500).json({ success: false, error: "Lỗi máy chủ nội bộ" });
  }
}
