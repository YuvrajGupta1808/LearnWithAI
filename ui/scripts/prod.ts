import "./env";

import db, { pool } from "../db/drizzle";
import * as schema from "../db/schema";

const main = async () => {
  try {
    console.log("Seeding production-style starter data");

    await db.delete(schema.courseGenerationJobs);
    await db.delete(schema.lessonProgress);
    await db.delete(schema.userProgress);
    await db.delete(schema.lessons);
    await db.delete(schema.units);
    await db.delete(schema.courses);

    const [course] = await db
      .insert(schema.courses)
      .values({
        title: "Science",
        imageSrc: "/science.svg",
      })
      .returning();

    const [unit] = await db
      .insert(schema.units)
      .values({
        courseId: course.id,
        title: "Cell Structure",
        description: "An overview of the major parts of a cell and what they do.",
        order: 1,
        content:
          "Cells contain specialized structures called organelles. Each organelle has a specific role that helps the cell survive, grow, and reproduce.",
        objectives: [
          "Identify the main organelles in a cell",
          "Explain the function of each organelle",
          "Compare plant and animal cells",
        ],
      })
      .returning();

    await db.insert(schema.lessons).values({
      unitId: unit.id,
      title: "Cell Structure",
      order: 1,
      description: "A text-first lesson generated from the unit section.",
      content:
        "Cells contain a nucleus, membrane, cytoplasm, and other organelles. Together these structures help manage energy, protect the cell, and control genetic information.",
      objectives: [
        "Identify the main organelles in a cell",
        "Explain the function of each organelle",
        "Compare plant and animal cells",
      ],
      videoUrl: null,
    });

    console.log("Production seed finished");
  } catch (error) {
    console.error(error);
    throw new Error("Failed to seed the database");
  } finally {
    await pool.end();
  }
};

main();
