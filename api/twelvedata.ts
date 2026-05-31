import type { Request, Response } from "express";

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

// In-memory store for tracking IP request counts
const rateLimitStore = new Map<string, RateLimitRecord>();

const WINDOW_MS = 60 * 1000; // 1-minute window
const MAX_REQUESTS = 10;     // Limit to 10 requests per minute per IP to protect API quota

/**
 * Purges expired entries from the rate limit Map to prevent memory leaks.
 */
function purgeExpired() {
  const now = Date.now();
  for (const [ip, record] of rateLimitStore.entries()) {
    if (now > record.resetTime) {
      rateLimitStore.delete(ip);
    }
  }
}

/**
 * Extracts client IP address accurately from standard request proxy headers.
 */
function getClientIp(req: Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) {
    if (typeof forwarded === "string") {
      return forwarded.split(",")[0].trim();
    } else if (Array.isArray(forwarded)) {
      return forwarded[0].trim();
    }
  }
  const realIp = req.headers["x-real-ip"];
  if (typeof realIp === "string" && realIp) return realIp;
  return req.socket.remoteAddress || "unknown-ip";
}

export default async function handler(req: Request, res: Response) {
  try {
    const ip = getClientIp(req);
    const now = Date.now();

    // Occasional self-cleaning
    purgeExpired();

    let record = rateLimitStore.get(ip);
    if (!record) {
      record = { count: 1, resetTime: now + WINDOW_MS };
      rateLimitStore.set(ip, record);
    } else {
      if (now > record.resetTime) {
        record.count = 1;
        record.resetTime = now + WINDOW_MS;
      } else {
        record.count += 1;
      }
    }

    // Set standard rate-limiting headers for transparent security
    res.setHeader("X-RateLimit-Limit", MAX_REQUESTS);
    res.setHeader("X-RateLimit-Remaining", Math.max(0, MAX_REQUESTS - record.count));
    res.setHeader("X-RateLimit-Reset", Math.ceil(record.resetTime / 1000));

    if (record.count > MAX_REQUESTS) {
      return res.status(429).json({
        error: "Quá tải yêu cầu (Too Many Requests). Bạn đã vượt quá giới hạn 10 lượt tra cứu / phút."
      });
    }

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
