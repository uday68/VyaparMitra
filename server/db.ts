import dotenv from "dotenv";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "../shared/schema";
import * as chatSchema from "../shared/models/chat";

// Load environment variables first
dotenv.config({ path: '.env.development' });

const { Pool } = pg;

// Use POSTGRES_URI from environment (matches our .env.development)
const databaseUrl = process.env.POSTGRES_URI || process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "POSTGRES_URI or DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ connectionString: databaseUrl });
// Merge schemas
export const db = drizzle(pool, { schema: { ...schema, ...chatSchema } });
