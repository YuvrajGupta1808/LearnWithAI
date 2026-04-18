import "./env";

import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { extractPdfText } from "../lib/course-generation/pdf";
import { splitTextIntoChunks } from "../lib/course-generation/chunking";

async function main() {
  const inputPath = process.argv[2];

  if (!inputPath) {
    throw new Error("Usage: tsx scripts/test-pdf-parser.ts <path-to-pdf>");
  }

  const absolutePath = resolve(inputPath);
  const buffer = await readFile(absolutePath);
  const text = await extractPdfText(buffer);
  const chunks = splitTextIntoChunks(text);

  console.log(
    JSON.stringify(
      {
        path: absolutePath,
        textLength: text.length,
        chunkCount: chunks.length,
        firstChunkLength: chunks[0]?.length ?? 0,
        preview: text.slice(0, 1200),
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
