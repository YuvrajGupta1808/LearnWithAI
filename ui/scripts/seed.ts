import "./env";

import db, { pool } from "../db/drizzle";
import * as schema from "../db/schema";

const main = async () => {
  try {
    console.log("Cleaning and Seeding database with a minimalist setup");

    // Clean all existing data (Note: many tables were deleted in the cleanup)
    await db.delete(schema.courses);
    await db.delete(schema.userProgress);
    await db.delete(schema.units);
    await db.delete(schema.lessons);
    await db.delete(schema.lessonProgress);
    await db.delete(schema.courseGenerationJobs);

    // Insert Maths course
    const [course] = await db.insert(schema.courses).values([
      {
        title: "Maths",
        imageSrc: "/maths.svg",
      },
    ]).returning();

    // Insert one unit (Book)
    const [unit] = await db.insert(schema.units).values([
      {
        courseId: course.id,
        title: "Advanced Algebra Fundamentals",
        description: "By Dr. Sarah Jenkins - Academic Press",
        order: 1,
        content: "In this chapter, you will learn the basics of variables. A variable is a symbol for a number we don't know yet. It is often a letter like x or y.",
        objectives: ["What is a variable?", "How to isolate a variable", "Basic algebraic expressions"],
      }
    ]).returning();

    // Insert three video lessons (Chapters)
    await db.insert(schema.lessons).values([
      {
        unitId: unit.id,
        order: 1,
        title: "Understanding Variables",
        description: "A deep dive into variables with a working video link.",
        content: "Variables are symbols that represent unknown values. In algebra, they let us express relationships, build equations, and solve problems step by step.",
        videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
        objectives: ["Identify constants vs variables", "Set up a basic equation", "Solve for X"],
      },
      {
        unitId: unit.id,
        order: 2,
        title: "No Video (Null)",
        description: "Testing our placeholder UI by providing no video URL.",
        content: "This lesson uses text content only. The screen should still communicate the core idea clearly even without a video attached.",
        videoUrl: null, 
        objectives: ["Observe the placeholder icon", "Check text styling", "Verify layout spacing"],
      },
      {
        unitId: unit.id,
        order: 3,
        title: "Incorrect URL",
        description: "Testing how the app handles a broken or incorrect video link.",
        content: "A lesson can still be useful when its instructional content lives in text instead of video. This block verifies the textual fallback path.",
        videoUrl: "https://not-a-video-link.com/broken",
        objectives: ["Check iframe behavior", "Error state handling", "External link fallback"],
      },
    ]);

    console.log("Seeding finished - minimalist schema ready");
  } catch (error) {
    console.error(error);
    throw new Error("Failed to seed the database");
  } finally {
    await pool.end();
  }
};

main();
