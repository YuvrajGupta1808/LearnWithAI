import "./env";

import { pool } from "../db/drizzle";

const sequenceTargets = [
  { table: "courses", column: "id" },
  { table: "units", column: "id" },
  { table: "lessons", column: "id" },
  { table: "lesson_progress", column: "id" },
  { table: "course_generation_jobs", column: "id" },
] as const;

async function main() {
  try {
    for (const target of sequenceTargets) {
      const sql = `
        SELECT setval(
          pg_get_serial_sequence('${target.table}', '${target.column}'),
          COALESCE((SELECT MAX(${target.column}) FROM ${target.table}), 1),
          COALESCE((SELECT MAX(${target.column}) IS NOT NULL FROM ${target.table}), false)
        );
      `;

      await pool.query(sql);
      console.log(`Synced sequence for ${target.table}.${target.column}`);
    }
  } catch (error) {
    console.error(error);
    throw new Error("Failed to sync serial sequences");
  } finally {
    await pool.end();
  }
}

main();
