/**
 * Client-side license verification (no server).
 *
 * A license key is an ECDSA P-256 signature over `MESSAGE_PREFIX + <normalized email>`.
 * Only the holder of the PRIVATE key (you, offline — see scripts/gen-license.mjs) can
 * mint a valid key. The app ships ONLY the PUBLIC key below, which can verify but never
 * forge — so a user reading the bundle cannot generate keys.
 *
 * Limits (inherent to client-side, no-server licensing):
 *  - A key is bound to one email; entering a non-matching email fails verification.
 *  - But a real (email, key) pair can still be shared, and keys can't be revoked remotely.
 *    For hard enforcement you'd need the server endpoints from the legacy app.
 */

// Public key only. Safe to ship. Regenerate the pair with scripts/gen-license.mjs setup.
const PUBLIC_KEY_JWK: JsonWebKey = {
  kty: "EC",
  crv: "P-256",
  x: "A3PuVlOAR88x8q29RhY515MH282972LUtNV0q83q3L4",
  y: "2vzJqkGQyEAZFvjsvDyd8PlM6jqJDiHOmU6TgQnmcBI",
};

const KEY_PREFIX = "RWP1-";
const MESSAGE_PREFIX = "riskwise-premium-v1:";

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** The exact message that gets signed to produce a key for a given email. */
export function licenseMessage(email: string): string {
  return MESSAGE_PREFIX + normalizeEmail(email);
}

function base64urlToBytes(input: string): Uint8Array {
  const s = input.replace(/-/g, "+").replace(/_/g, "/");
  const pad = s.length % 4 ? "=".repeat(4 - (s.length % 4)) : "";
  const bin = atob(s + pad);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

let publicKey: Promise<CryptoKey> | null = null;
function getPublicKey(): Promise<CryptoKey> {
  if (!publicKey) {
    publicKey = crypto.subtle.importKey(
      "jwk",
      PUBLIC_KEY_JWK,
      { name: "ECDSA", namedCurve: "P-256" },
      false,
      ["verify"]
    );
  }
  return publicKey;
}

/**
 * True only if `key` is a valid signature of `email` under our public key.
 * Tolerant of the optional "RWP1-" prefix and surrounding whitespace.
 */
export async function verifyLicense(email: string, key: string): Promise<boolean> {
  try {
    const normEmail = normalizeEmail(email);
    if (!normEmail || !normEmail.includes("@") || !key) return false;

    let raw = key.trim();
    if (raw.slice(0, KEY_PREFIX.length).toUpperCase() === KEY_PREFIX) {
      raw = raw.slice(KEY_PREFIX.length);
    }
    const signature = base64urlToBytes(raw);
    if (signature.length !== 64) return false; // P-256 raw r||s

    const message = new TextEncoder().encode(licenseMessage(normEmail));
    const pub = await getPublicKey();
    return await crypto.subtle.verify({ name: "ECDSA", hash: "SHA-256" }, pub, signature, message);
  } catch {
    return false;
  }
}
