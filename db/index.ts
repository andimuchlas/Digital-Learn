import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env" });

const connectionString = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/postgres";

// Client configured for PostgreSQL (compatible with Supabase Session & Transaction poolers & Serverless)
export const client = postgres(connectionString, {
  prepare: false,
  max: 10,
  idle_timeout: 20,
  connect_timeout: 5,
  ssl: connectionString.includes("supabase.co") || connectionString.includes("pooler.supabase.com") ? "require" : undefined,
});

export const db = drizzle(client, { schema });
export * from "./schema";
