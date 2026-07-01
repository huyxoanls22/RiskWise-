import type { Request, Response } from "express";
import { verifyLicenseSignature, rateLimit } from "./_security";

const base64Decode = (str: string): string => {
  try {
    return Buffer.from(str, "base64").toString("utf-8");
  } catch {
    return "";
  }
};

export default async function handler(req: Request, res: Response) {
  try {
    // Throttle to prevent signature brute-force / key enumeration.
    if (!rateLimit(req, res, "license-verify", 20, 60 * 1000)) {
      return res.status(429).json({ isValid: false, error: "Quá nhiều yêu cầu, vui lòng thử lại sau." });
    }

    const { email, licenseKey } = req.body || {};

    if (!email || !licenseKey) {
      return res.status(400).json({ isValid: false, error: "Thiếu email hoặc mã kích hoạt để đối soát" });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const trimmedKey = String(licenseKey).trim();

    // 1. Identify valid prefix
    const supportedPrefixes = ["RW-MTH-", "RW-YEAR-", "RW5-MTH-", "RW10-YEAR-", "RWP-"];
    let matchedPrefix = "";
    for (const p of supportedPrefixes) {
      if (trimmedKey.startsWith(p)) {
        matchedPrefix = p;
        break;
      }
    }

    if (!matchedPrefix) {
      return res.status(400).json({
        isValid: false,
        error: "Định dạng mã kích hoạt không hợp lệ (Tiền tố không được hệ thống hỗ trợ)"
      });
    }

    // 2. Decode Payload
    const rest = trimmedKey.substring(matchedPrefix.length);
    const parts = rest.split("-");
    if (parts.length !== 2) {
      return res.status(400).json({ isValid: false, error: "Mã kích hoạt không đúng định dạng cấu trúc" });
    }

    const encodedPayload = parts[0];
    const givenSignature = parts[1].toUpperCase();

    const decodedPayload = base64Decode(encodedPayload);
    if (!decodedPayload || !decodedPayload.includes(":")) {
      return res.status(400).json({ isValid: false, error: "Không thể giải thuật mã hóa nội dung khóa" });
    }

    const [payloadEmail, payloadExpiry] = decodedPayload.split(":");
    if (payloadEmail !== cleanEmail) {
      return res.status(400).json({
        isValid: false,
        error: "Email của bạn không trùng khớp với thông tin đăng ký của hệ thống!"
      });
    }

    // 3. Verify Signature with secure server-only HMAC key (constant time)
    if (!verifyLicenseSignature(decodedPayload, givenSignature)) {
      return res.status(400).json({
        isValid: false,
        error: "Chữ ký mã hóa của License Key không hợp lệ hoặc đã bị thay đổi!"
      });
    }

    // 4. Validate Expiry Date
    const expiryDateObj = new Date(payloadExpiry);
    if (isNaN(expiryDateObj.getTime())) {
      return res.status(400).json({ isValid: false, error: "Ngày kết hạn ghi nhận trong mã không hợp lệ" });
    }

    return res.json({
      isValid: true,
      email: payloadEmail,
      expiryDateString: payloadExpiry, // string format: YYYY-MM-DD
    });

  } catch (err: any) {
    console.error("Lỗi xác minh mã kích hoạt:", err);
    return res.status(500).json({ isValid: false, error: "Lỗi máy chủ nội bộ" });
  }
}
