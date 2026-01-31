/**
 * PKCE (Proof Key for Code Exchange) Utilities
 * RFC 7636 implementation for OAuth 2.0 public clients
 */

/**
 * Generate a cryptographically secure random string
 * Uses characters allowed in PKCE verifiers (A-Z, a-z, 0-9, -._~)
 */
export function generateRandomString(length: number): string {
  const charset =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
  const randomValues = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(randomValues)
    .map((v) => charset[v % charset.length])
    .join("");
}

/**
 * Compute SHA-256 hash of a string
 */
async function sha256(plain: string): Promise<ArrayBuffer> {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  return crypto.subtle.digest("SHA-256", data);
}

/**
 * Base64 URL encode an ArrayBuffer
 * Uses URL-safe characters and strips padding
 */
function base64urlEncode(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/**
 * Generate a PKCE code challenge from a verifier
 * Uses S256 method (SHA-256 hash, base64url encoded)
 */
export async function generateCodeChallenge(verifier: string): Promise<string> {
  const hash = await sha256(verifier);
  return base64urlEncode(hash);
}

/**
 * Generate a complete PKCE pair (verifier and challenge)
 */
export async function generatePKCEPair(): Promise<{
  codeVerifier: string;
  codeChallenge: string;
}> {
  const codeVerifier = generateRandomString(64);
  const codeChallenge = await generateCodeChallenge(codeVerifier);
  return { codeVerifier, codeChallenge };
}

/**
 * Generate a state parameter for CSRF protection
 */
export function generateState(): string {
  return generateRandomString(32);
}

/**
 * Generate a nonce for replay attack protection
 */
export function generateNonce(): string {
  return generateRandomString(32);
}

