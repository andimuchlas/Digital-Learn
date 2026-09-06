// Edge-safe and Node-safe session token management using standard Web Crypto API
export const SESSION_COOKIE_NAME = "admin_session";

const SESSION_SECRET =
  process.env.ADMIN_SESSION_SECRET ||
  "digital-learn-quiz-admin-session-secret-key-2026";

export interface AdminSessionPayload {
  username: string;
  name: string;
  exp: number;
}

function stringToUint8Array(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

function base64UrlEncode(str: string): string {
  if (typeof btoa === "function") {
    return btoa(str)
      .replace(/=/g, "")
      .replace(/\+/g, "-")
      .replace(/\//g, "_");
  }
  return Buffer.from(str)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) {
    base64 += "=";
  }
  if (typeof atob === "function") {
    return atob(base64);
  }
  return Buffer.from(base64, "base64").toString("utf-8");
}

function uint8ArrayToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return base64UrlEncode(binary);
}

function base64UrlToUint8Array(str: string): Uint8Array {
  const binary = base64UrlDecode(str);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function getHmacKey(secret: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  return crypto.subtle.importKey(
    "raw",
    enc.encode(secret) as unknown as BufferSource,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

/**
 * Create a signed session token (safe for Node & Edge)
 */
export async function createSessionToken(
  payload: Omit<AdminSessionPayload, "exp">,
  expiresInSeconds: number = 7 * 24 * 60 * 60
): Promise<string> {
  const fullPayload: AdminSessionPayload = {
    ...payload,
    exp: Math.floor(Date.now() / 1000) + expiresInSeconds,
  };

  const header = { alg: "HS256", typ: "JWT" };
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(fullPayload));
  const data = `${encodedHeader}.${encodedPayload}`;

  const key = await getHmacKey(SESSION_SECRET);
  const signatureBuffer = await crypto.subtle.sign(
    "HMAC",
    key,
    stringToUint8Array(data) as unknown as BufferSource
  );

  const signature = uint8ArrayToBase64Url(new Uint8Array(signatureBuffer));
  return `${data}.${signature}`;
}

/**
 * Verify a signed session token (safe for Node & Edge)
 */
export async function verifySessionToken(
  token: string | undefined | null
): Promise<AdminSessionPayload | null> {
  if (!token) return null;
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const [encodedHeader, encodedPayload, signature] = parts;
    const data = `${encodedHeader}.${encodedPayload}`;

    const key = await getHmacKey(SESSION_SECRET);
    const sigBytes = base64UrlToUint8Array(signature);

    const isValid = await crypto.subtle.verify(
      "HMAC",
      key,
      sigBytes as unknown as BufferSource,
      stringToUint8Array(data) as unknown as BufferSource
    );

    if (!isValid) return null;

    const payload: AdminSessionPayload = JSON.parse(
      base64UrlDecode(encodedPayload)
    );

    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}
