import crypto from "crypto";
import type { Request, Response } from "express";

/**
 * Shared server-side security helpers (rate limiting, admin PIN auth, HMAC
 * signing). Files prefixed with "_" are treated as modules, not routes, by
 * Vercel, so this is never exposed as an HTTP endpoint.
 */

// --- Admin PIN -------------------------------------------------------------

/**
 * Normalizes a PIN so Vietnamese TELEX/VNI accents and stray spaces don't
 * cause spurious mismatches.
 */
export const normalizePin = (str: string): string => {
  if (!str) return "";
  return str
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[đĐ]/g, "d")
    .toLowerCase()
    .replace(/\s+/g, "")
    .trim();
};

/** Constant-time string comparison to avoid timing side-channels. */
const timingSafeEqual = (a: string, b: string): boolean => {
  const bufA = Buffer.from(a, "utf-8");
  const bufB = Buffer.from(b, "utf-8");
  if (bufA.length !== bufB.length) {
    // Still run a comparison to keep timing roughly constant.
    crypto.timingSafeEqual(bufA, bufA);
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
};

/**
 * Verifies an admin PIN against ADMIN_PIN. Returns false when the env var is
 * not configured — there is no insecure hardcoded fallback.
 */
export const verifyAdminPin = (enteredPin: string): boolean => {
  const correctPin = process.env.ADMIN_PIN;
  if (!correctPin || !enteredPin) return false;
  return (
    timingSafeEqual(enteredPin, correctPin) ||
    timingSafeEqual(normalizePin(enteredPin), normalizePin(correctPin))
  );
};

// --- HMAC license signing --------------------------------------------------

/**
 * Computes the HMAC-SHA256 signature of a payload using LICENSE_SECRET_KEY.
 * Throws if the secret is not configured so we never sign with a weak default.
 */
export const signLicensePayload = (payload: string): string => {
  const secret = process.env.LICENSE_SECRET_KEY;
  if (!secret) {
    throw new Error("LICENSE_SECRET_KEY is not configured on the server");
  }
  return crypto
    .createHmac("sha256", secret)
    .update(payload, "utf-8")
    .digest("hex")
    .toUpperCase();
};

/** Constant-time comparison of two license signatures. */
export const verifyLicenseSignature = (payload: string, given: string): boolean => {
  let expected: string;
  try {
    expected = signLicensePayload(payload);
  } catch {
    return false;
  }
  return timingSafeEqual(expected, (given || "").toUpperCase());
};

// --- Rate limiting ---------------------------------------------------------

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const stores = new Map<string, Map<string, RateLimitRecord>>();

/** Extracts the client IP, tolerating common proxy headers. */
export function getClientIp(req: Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded) {
    return forwarded.split(",")[0].trim();
  }
  if (Array.isArray(forwarded) && forwarded.length) {
    return forwarded[0].trim();
  }
  const realIp = req.headers["x-real-ip"];
  if (typeof realIp === "string" && realIp) return realIp;
  return req.socket?.remoteAddress || "unknown-ip";
}

/**
 * Fixed-window in-memory rate limiter. Best-effort only (per-instance memory),
 * but raises the cost of brute-force/abuse meaningfully. Sets the standard
 * X-RateLimit-* headers and returns true when the request is allowed.
 *
 * @param bucket  logical name so different endpoints have independent windows
 */
export function rateLimit(
  req: Request,
  res: Response,
  bucket: string,
  maxRequests: number,
  windowMs: number
): boolean {
  let store = stores.get(bucket);
  if (!store) {
    store = new Map();
    stores.set(bucket, store);
  }

  const now = Date.now();
  // Opportunistically purge expired entries to avoid unbounded growth.
  for (const [ip, record] of store.entries()) {
    if (now > record.resetTime) store.delete(ip);
  }

  const key = getClientIp(req);
  let record = store.get(key);
  if (!record || now > record.resetTime) {
    record = { count: 1, resetTime: now + windowMs };
    store.set(key, record);
  } else {
    record.count += 1;
  }

  res.setHeader("X-RateLimit-Limit", maxRequests);
  res.setHeader("X-RateLimit-Remaining", Math.max(0, maxRequests - record.count));
  res.setHeader("X-RateLimit-Reset", Math.ceil(record.resetTime / 1000));

  return record.count <= maxRequests;
}
