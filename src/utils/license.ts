const SECRET_SIGNING_KEY = "RISKWISE_SECURE_KEY_2026";

// Simple DJB2 polynomial-like rolling hash algorithm for signature verification
const simpleHash = (str: string): string => {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i);
  }
  return (hash >>> 0).toString(16).toUpperCase();
};

// Safe Unicode-compatible Base64 encoder/decoder helper
const base64Encode = (str: string): string => {
  try {
    return btoa(unescape(encodeURIComponent(str)));
  } catch {
    return "";
  }
};

const base64Decode = (str: string): string => {
  try {
    return decodeURIComponent(escape(atob(str)));
  } catch {
    return "";
  }
};

/**
 * Generates a valid license key format `RWP-[Payload]-[Signature]`
 * @param email User's registration email
 * @param expiryDate Expiration date in format YYYY-MM-DD
 */
export const generateLicenseKey = (email: string, expiryDate: string): string => {
  const cleanEmail = email.trim().toLowerCase();
  const cleanExpiry = expiryDate.trim(); // Format: YYYY-MM-DD
  const payload = `${cleanEmail}:${cleanExpiry}`;
  const encodedPayload = base64Encode(payload);
  const signature = simpleHash(`${payload}:${SECRET_SIGNING_KEY}`);
  return `RWP-${encodedPayload}-${signature}`;
};

interface LicenseVerifyResult {
  isValid: boolean;
  email?: string;
  expiryDate?: Date;
  error?: string;
}

/**
 * Verifies a given license key against the provided user email
 */
export const verifyLicenseKey = (email: string, licenseKey: string): LicenseVerifyResult => {
  const cleanEmail = email.trim().toLowerCase();
  const trimmedKey = licenseKey.trim();

  if (!trimmedKey.startsWith("RWP-")) {
    return { isValid: false, error: "Định dạng mã kích hoạt không hợp lệ (Phải bắt đầu với RWP-)" };
  }

  const parts = trimmedKey.split("-");
  if (parts.length !== 3) {
    return { isValid: false, error: "Mã kích hoạt không đúng định dạng (Thiếu thành phần)" };
  }

  const encodedPayload = parts[1];
  const givenSignature = parts[2].toUpperCase();

  const decodedPayload = base64Decode(encodedPayload);
  if (!decodedPayload || !decodedPayload.includes(":")) {
    return { isValid: false, error: "Không thể giải mã nội dung mã kích hoạt" };
  }

  const [payloadEmail, payloadExpiry] = decodedPayload.split(":");
  if (payloadEmail !== cleanEmail) {
    return { isValid: false, error: "Email của bạn không trùng khớp với thông tin ký nhận trong mã kích hoạt này!" };
  }

  // Re-verify the signature
  const expectedSignature = simpleHash(`${decodedPayload}:${SECRET_SIGNING_KEY}`);
  if (givenSignature !== expectedSignature) {
    return { isValid: false, error: "Chữ ký số của mã kích hoạt đã bị giả mạo hoặc sai lệch thông tin!" };
  }

  const expiryDateObj = new Date(payloadExpiry);
  if (isNaN(expiryDateObj.getTime())) {
    return { isValid: false, error: "Ngày hết hạn ghi nhận trong mã không hợp lệ!" };
  }

  return {
    isValid: true,
    email: payloadEmail,
    expiryDate: expiryDateObj
  };
};
