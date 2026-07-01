/**
 * Offline license-key generator. Run this ONLY on your own machine — it uses the
 * private key in scripts/license-keypair.json, which must never ship to users.
 *
 * Usage:
 *   node scripts/gen-license.mjs buyer@email.com
 *
 * Prints the key to give the buyer. They activate by entering the SAME email + key
 * in the app. The email is normalized (trim + lowercase) before signing, so casing
 * and stray spaces don't matter.
 */
import { readFileSync } from "node:fs";

const emailArg = process.argv[2];
if (!emailArg || !emailArg.includes("@")) {
  console.error("Usage: node scripts/gen-license.mjs <buyer-email>");
  process.exit(1);
}

const keypairUrl = new URL("./license-keypair.json", import.meta.url);
const { privateJwk } = JSON.parse(readFileSync(keypairUrl, "utf-8"));

const email = emailArg.trim().toLowerCase();
const message = new TextEncoder().encode("riskwise-premium-v1:" + email);

const privateKey = await crypto.subtle.importKey(
  "jwk",
  privateJwk,
  { name: "ECDSA", namedCurve: "P-256" },
  false,
  ["sign"]
);
const sig = await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, privateKey, message);
const b64url = Buffer.from(sig).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

console.log("Email :", email);
console.log("Key   :", "RWP1-" + b64url);
