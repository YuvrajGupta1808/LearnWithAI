import "./env";

import db, { pool } from "../db/drizzle";
import * as schema from "../db/schema";

const main = async () => {
  try {
    console.log("Resetting the database");

    await db.delete(schema.courseGenerationJobs);
    await db.delete(schema.lessonProgress);
    await db.delete(schema.userProgress);
    await db.delete(schema.lessons);
    await db.delete(schema.units);
    await db.delete(schema.courses);

    console.log("Resetting finished");
  } catch (error) {
    console.error(error);
    throw new Error("Failed to reset the database");
  } finally {
    await pool.end();
  }
};

main();
