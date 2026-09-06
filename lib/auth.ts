import crypto from "crypto";
import { db, admins } from "@/db";
import { eq } from "drizzle-orm";
export * from "./session";

/**
 * Hash a plain password with a salt using PBKDF2 (SHA-512)
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto
    .pbkdf2Sync(password, salt, 10000, 64, "sha512")
    .toString("hex");
  return `${salt}:${hash}`;
}

/**
 * Verify a plain password against a salt:hash string
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  try {
    const [salt, originalHash] = storedHash.split(":");
    if (!salt || !originalHash) return false;
    const computedHash = crypto
      .pbkdf2Sync(password, salt, 10000, 64, "sha512")
      .toString("hex");
    return crypto.timingSafeEqual(
      Buffer.from(computedHash, "hex"),
      Buffer.from(originalHash, "hex")
    );
  } catch {
    return false;
  }
}

/**
 * Verify admin credentials from database or fallback to .env credentials
 */
export async function authenticateAdmin(
  username: string,
  password: string
): Promise<{ success: boolean; user?: { username: string; name: string } }> {
  const envUsername = process.env.ADMIN_USERNAME || "admin";
  const envPassword = process.env.ADMIN_PASSWORD || "admin123";

  // 1. Fast-path: Check environment credentials directly (instant response)
  if (username === envUsername && password === envPassword) {
    return {
      success: true,
      user: { username: envUsername, name: process.env.ADMIN_NAME || "Administrator" },
    };
  }

  // 2. Query database for other registered admin accounts
  try {
    const existing = await db
      .select()
      .from(admins)
      .where(eq(admins.username, username))
      .limit(1);

    if (existing.length > 0) {
      const admin = existing[0];
      if (verifyPassword(password, admin.passwordHash)) {
        return {
          success: true,
          user: { username: admin.username, name: admin.name },
        };
      }
      return { success: false };
    }
  } catch (err) {
    console.error("Database check failed:", err);
  }

  return { success: false };
}
