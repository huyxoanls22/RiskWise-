/**
 * Client-side license helpers.
 *
 * SECURITY: The signing secret and the HMAC verification live ONLY on the
 * server (see api/_security.ts, api/license-verify.ts, api/license-generate.ts).
 * The browser must never hold the secret, otherwise anyone could read it from
 * the bundle and forge license keys. License generation is admin-only and is
 * never exposed to the client.
 */

export interface LicenseVerifyResult {
  isValid: boolean;
  email?: string;
  expiryDate?: Date;
  error?: string;
}

/**
 * Verifies a license key by delegating to the server, which holds the secret
 * and performs the HMAC-SHA256 signature check.
 */
export const verifyLicenseKey = async (
  email: string,
  licenseKey: string
): Promise<LicenseVerifyResult> => {
  try {
    const res = await fetch("/api/license/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, licenseKey }),
    });

    const data = await res.json();

    if (!res.ok || !data.isValid) {
      return { isValid: false, error: data.error || "Mã kích hoạt không hợp lệ." };
    }

    return {
      isValid: true,
      email: data.email,
      expiryDate: data.expiryDateString ? new Date(data.expiryDateString) : undefined,
    };
  } catch {
    return { isValid: false, error: "Không thể kết nối đến máy chủ để xác thực mã kích hoạt." };
  }
};
