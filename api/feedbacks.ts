import type { Request, Response } from "express";
import fs from "fs";
import path from "path";
import { verifyAdminPin, rateLimit } from "./_security";

const FEEDBACK_FILE_PATH = path.join(process.cwd(), "beta_feedbacks.json");

// In-Memory cache fallback in case of strict read-only environments
let inMemoryFeedbacks: any[] = [];

// Load initial feedbacks
try {
  if (fs.existsSync(FEEDBACK_FILE_PATH)) {
    const raw = fs.readFileSync(FEEDBACK_FILE_PATH, "utf-8");
    inMemoryFeedbacks = JSON.parse(raw);
  }
} catch (err) {
  console.error("Warning: Could not read beta_feedbacks.json from disk, using safe memory cache:", err);
}

/** Strip HTML/angle-bracket content and cap length to neutralize stored XSS. */
const sanitizeText = (value: unknown, maxLen: number): string => {
  if (typeof value !== "string") return "";
  return value
    .replace(/<[^>]*>/g, "") // remove any HTML tags
    .replace(/[<>]/g, "")    // remove stray angle brackets
    .trim()
    .slice(0, maxLen);
};

/** Extracts the admin PIN from a header (preferred) or request body/query. */
const extractPin = (req: Request): string => {
  const headerPin = req.headers["x-admin-pin"];
  if (typeof headerPin === "string" && headerPin) return headerPin;
  return (req.body?.pin || req.query?.pin || "") as string;
};

const ALLOWED_CATEGORIES = ["feature", "bug", "ux", "other"];

export default async function handler(req: Request, res: Response) {
  const method = req.method;

  if (method === "POST") {
    try {
      // Rate-limit anonymous submissions to prevent spam/flooding.
      if (!rateLimit(req, res, "feedback-post", 5, 60 * 1000)) {
        return res.status(429).json({ success: false, error: "Bạn gửi phản hồi quá nhanh, vui lòng thử lại sau." });
      }

      const { email, category, message, userAgent } = req.body || {};

      const cleanMessage = sanitizeText(message, 5000);
      if (!cleanMessage) {
        return res.status(400).json({ success: false, error: "Nội dung phản hồi không được để trống!" });
      }

      const cleanEmail = sanitizeText(email, 254);
      const cleanCategory = ALLOWED_CATEGORIES.includes(category) ? category : "feature";

      const newFeedback = {
        id: "fb-" + Math.random().toString(36).substring(2, 11),
        email: cleanEmail,
        category: cleanCategory,
        message: cleanMessage,
        submittedAt: new Date().toISOString(),
        userAgent: sanitizeText(userAgent || req.headers["user-agent"] || "unknown", 512)
      };

      inMemoryFeedbacks.unshift(newFeedback);

      // Persist to disk (best-effort; environment may be read-only)
      try {
        fs.writeFileSync(FEEDBACK_FILE_PATH, JSON.stringify(inMemoryFeedbacks, null, 2), "utf-8");
      } catch (writeErr) {
        console.error("Warning: Could not write beta_feedbacks.json to disk:", writeErr);
      }

      return res.status(200).json({ success: true, message: "Gửi phản hồi thành công!" });
    } catch (err: any) {
      console.error("Lỗi khi gửi phản hồi:", err);
      return res.status(500).json({ success: false, error: "Lỗi máy chủ khi lưu phản hồi" });
    }
  }

  if (method === "GET") {
    try {
      if (!rateLimit(req, res, "feedback-admin", 20, 60 * 1000)) {
        return res.status(429).json({ success: false, error: "Quá nhiều yêu cầu, vui lòng thử lại sau." });
      }

      const pin = extractPin(req);
      if (!pin) {
        return res.status(400).json({ success: false, error: "Yêu cầu mã PIN quản trị viên để xem!" });
      }

      if (!verifyAdminPin(pin)) {
        return res.status(401).json({ success: false, error: "Mã PIN xác thực không chính xác!" });
      }

      return res.status(200).json({ success: true, feedbacks: inMemoryFeedbacks });
    } catch (err: any) {
      console.error("Lỗi khi tải phản hồi:", err);
      return res.status(500).json({ success: false, error: "Lỗi máy chủ khi lấy phản hồi" });
    }
  }

  if (method === "DELETE") {
    try {
      if (!rateLimit(req, res, "feedback-admin", 20, 60 * 1000)) {
        return res.status(429).json({ success: false, error: "Quá nhiều yêu cầu, vui lòng thử lại sau." });
      }

      const pin = extractPin(req);
      const feedbackId = req.body?.id;

      if (!pin) {
        return res.status(400).json({ success: false, error: "Yêu cầu mã PIN quản trị viên!" });
      }

      if (!verifyAdminPin(pin)) {
        return res.status(401).json({ success: false, error: "Mã PIN không chính xác!" });
      }

      if (feedbackId) {
        inMemoryFeedbacks = inMemoryFeedbacks.filter(fb => fb.id !== feedbackId);
      } else {
        inMemoryFeedbacks = [];
      }

      try {
        fs.writeFileSync(FEEDBACK_FILE_PATH, JSON.stringify(inMemoryFeedbacks, null, 2), "utf-8");
      } catch (writeErr) {
        console.error("Warning: Could not write beta_feedbacks.json to disk after delete:", writeErr);
      }

      return res.status(200).json({ success: true, message: "Đã xóa phản hồi!" });
    } catch (err: any) {
      console.error("Lỗi khi xóa phản hồi:", err);
      return res.status(500).json({ success: false, error: "Lỗi máy chủ khi xóa phản hồi" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
