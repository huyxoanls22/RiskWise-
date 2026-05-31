import type { Request, Response } from "express";

const normalizePin = (str: string): string => {
  if (!str) return "";
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Strip Vietnamese accents caused by TELEX/VNI
    .replace(/[đĐ]/g, "d")
    .toLowerCase()
    .replace(/\s+/g, "") // Strip any accidental spaces
    .trim();
};

export default async function handler(req: Request, res: Response) {
  try {
    const { pin } = req.body || {};
    if (!pin) {
      return res.status(400).json({ authorized: false, error: "Thiếu mã PIN đầu vào" });
    }

    const correctPin = process.env.ADMIN_PIN || "Emyeubachochiminh@2026";

    const normalizedEntered = normalizePin(pin);
    const normalizedCorrect = normalizePin(correctPin);

    const isMatch = (pin === correctPin) || (normalizedEntered === normalizedCorrect);

    if (isMatch) {
      return res.json({ authorized: true });
    } else {
      return res.status(401).json({ authorized: false, error: "Mã PIN xác thực không chính xác!" });
    }
  } catch (err: any) {
    console.error("Lỗi xác minh mã PIN quản trị:", err);
    return res.status(500).json({ authorized: false, error: err.message || "Lỗi máy chủ nội bộ" });
  }
}
