import type { Request, Response } from "express";
import fs from "fs";
import path from "path";

const FEEDBACK_FILE_PATH = path.join(process.cwd(), "beta_feedbacks.json");

// In-Memory cache fallback in case of strict read-only environments
let inMemoryFeedbacks: any[] = [];

// Load initial feedbaks
try {
  if (fs.existsSync(FEEDBACK_FILE_PATH)) {
    const raw = fs.readFileSync(FEEDBACK_FILE_PATH, "utf-8");
    inMemoryFeedbacks = JSON.parse(raw);
  }
} catch (err) {
  console.error("Warning: Could not read beta_feedbacks.json from disk, using safe memory cache:", err);
}

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

const verifyAdminPin = (enteredPin: string): boolean => {
  const correctPin = process.env.ADMIN_PIN || "Emyeubachochiminh@2026";
  const normalizedEntered = normalizePin(enteredPin);
  const normalizedCorrect = normalizePin(correctPin);
  return (enteredPin === correctPin) || (normalizedEntered === normalizedCorrect);
};

export default async function handler(req: Request, res: Response) {
  const method = req.method;

  if (method === "POST") {
    try {
      const { email, category, message, userAgent } = req.body || {};
      
      if (!message || !message.trim()) {
        return res.status(400).json({ success: false, error: "Nội dung phản hồi không được để trống!" });
      }

      const newFeedback = {
        id: "fb-" + Math.random().toString(36).substring(2, 11),
        email: (email || "").trim(),
        category: category || "feature",
        message: message.trim(),
        submittedAt: new Date().toISOString(),
        userAgent: userAgent || req.headers["user-agent"] || "unknown"
      };

      inMemoryFeedbacks.unshift(newFeedback);

      // Persist to disk
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
      const pin = req.query.pin as string;
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
      const pin = req.body?.pin || req.query?.pin;
      const feedbackId = req.body?.id;

      if (!pin) {
        return res.status(400).json({ success: false, error: "Yêu cầu mã PIN quản trị viên!" });
      }

      if (!verifyAdminPin(pin)) {
        return res.status(401).json({ success: false, error: "Mã PIN không chính xác!" });
      }

      if (feedbackId) {
        // Delete exact feedback item
        inMemoryFeedbacks = inMemoryFeedbacks.filter(fb => fb.id !== feedbackId);
      } else {
        // Clear all
        inMemoryFeedbacks = [];
      }

      // Persist to disk
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
