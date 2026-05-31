import type { Request, Response } from "express";

export default async function handler(req: Request, res: Response) {
  try {
    const symbol = req.query.symbol as string;
    if (!symbol) {
      return res.status(400).json({ error: "Thiếu thông tin ký hiệu symbol cần tra cứu" });
    }

    const apiKey = process.env.TWELVE_DATA_API_KEY || process.env.VITE_TWELVE_DATA_API_KEY;
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
    return res.status(500).json({ error: err.message || "Lỗi máy chủ nội bộ" });
  }
}
