import type { Request, Response } from "express";

const normalizePin = (str: string): string => {
  if (!str) return "";
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")
    .toLowerCase()
    .replace(/\s+/g, "")
    .trim();
};

const simpleHash = (str: string): string => {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i);
  }
  return (hash >>> 0).toString(16).toUpperCase();
};

const base64Encode = (str: string): string => {
  return Buffer.from(str, "utf-8").toString("base64");
};

export default async function handler(req: Request, res: Response) {
  try {
    const { pin, email, prefix } = req.body || {};
    
    // 1. Authenticate with PIN
    if (!pin) {
      return res.status(400).json({ success: false, error: "Thiếu mã PIN quản trị viên" });
    }

    const correctPin = process.env.ADMIN_PIN || "Emyeubachochiminh@2026";
    const normalizedEntered = normalizePin(pin);
    const normalizedCorrect = normalizePin(correctPin);
    const isPinMatch = (pin === correctPin) || (normalizedEntered === normalizedCorrect);

    if (!isPinMatch) {
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

    // 4. Generate License Key Structure
    const signingKey = process.env.LICENSE_SECRET_KEY || "RISKWISE_SECURE_KEY_2026";
    const payloadStr = `${cleanEmail}:${targetExpiryStr}`;
    const encodedPayload = base64Encode(payloadStr);

    const signature = simpleHash(`${payloadStr}:${signingKey}`);
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
    return res.status(500).json({ success: false, error: err.message || "Lỗi máy chủ nội bộ" });
  }
}
