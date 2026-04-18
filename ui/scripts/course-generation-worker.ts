import "./env";

import { runCourseGenerationWorker } from "../lib/course-generation/worker";

const once = process.argv.includes("--once");

runCourseGenerationWorker({ once }).catch((error) => {
  console.error(error);
  process.exit(1);
});
