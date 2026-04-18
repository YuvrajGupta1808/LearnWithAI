import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import * as schema from "./schema";

const globalForDb = globalThis as unknown as {
  pool: Pool | undefined;
};

function createPool(): Pool {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }

  const insecureSsl =
    /sslmode=no-verify/i.test(connectionString) ||
    process.env.DATABASE_SSL_REJECT_UNAUTHORIZED === "false";

  return new Pool({
    connectionString,
    max: 10,
    ssl: insecureSsl ? { rejectUnauthorized: false } : undefined,
  });
}

export const pool = globalForDb.pool ?? createPool();

if (process.env.NODE_ENV !== "production") {
  globalForDb.pool = pool;
}

const db = drizzle(pool, { schema });

export default db;
