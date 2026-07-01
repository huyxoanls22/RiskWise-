import type { Request, Response } from "express";
import { rateLimit } from "./_security";

export default async function handler(req: Request, res: Response) {
  try {
    // Limit to 10 requests per minute per IP to protect API quota.
    if (!rateLimit(req, res, "twelvedata", 10, 60 * 1000)) {
      return res.status(429).json({
        error: "Quá tải yêu cầu (Too Many Requests). Bạn đã vượt quá giới hạn 10 lượt tra cứu / phút."
      });
    }

    const symbol = req.query.symbol as string;
    if (!symbol) {
      return res.status(400).json({ error: "Thiếu thông tin ký hiệu symbol cần tra cứu" });
    }

    // Server-only key. The VITE_-prefixed variant is intentionally NOT used
    // here because Vite would inline it into the public client bundle.
    const apiKey = process.env.TWELVE_DATA_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "Twelve Data API key chưa được cấu hình trên server" });
    }

    const url = `https://api.twelvedata.com/quote?symbol=${encodeURIComponent(symbol)}&apikey=${apiKey}`;
    const targetRes = await fetch(url);

    if (!targetRes.ok) {
      return res.status(targetRes.status).json({ error: `Twelve Data API trả về lỗi: ${targetRes.status}` });
    }

    const data = await targetRes.json();
    return res.json(data);
  } catch (err: any) {
    console.error("Lỗi proxy Twelve Data:", err);
    return res.status(500).json({ error: "Lỗi máy chủ nội bộ" });
  }
}
