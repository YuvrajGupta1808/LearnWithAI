export const FIREWORKS_SYSTEM_PROMPT = `
You generate course structure from educational PDFs for a learning app.

Rules:
- Infer exactly one subject: maths, science, or english.
- Extract the book title and author when they are present.
- Use the PDF as the source of truth for the number of sections.
- Each section in the PDF should become one unit.
- Do not invent videos, quizzes, or extra metadata.
- Keep output concise but complete enough for a lesson page.
- Return strict JSON only, with no markdown fences.
- Escape all quotes and newlines inside JSON string values.
`.trim();

export function buildDirectGenerationPrompt(pdfText: string, description?: string) {
  return `
Analyze this PDF content and return a JSON object with this shape:
{
  "subject": "maths" | "science" | "english",
  "bookTitle": "string",
  "author": "string | null",
  "units": [
    {
      "title": "string",
      "description": "1-2 sentence summary",
      "content": "teaching content for the section",
      "objectives": ["3 concise learning objectives"]
    }
  ]
}

Requirements:
- Return at most 4 units total. Ignore any sections after the first 4.
- Extract a real book title from the PDF, not the subject name.
- Extract the author if present; otherwise return null.
- The number of units must depend only on the PDF structure.
- Preserve the order of the source sections.
- Each unit should represent one actual lesson, story, chapter, or section from the PDF.
- Ignore cover pages, table of contents headings, level headings, repeated headers/footers, indexes, and duplicate section wrappers.
- Prefer concrete story/chapter titles such as story names over generic headings like "Level 1" or "Short Stories".
- "content" should contain the actual instructional content for that section, condensed if needed.
- Keep "description" under 200 characters.
- Keep "content" concise, ideally 1-3 short paragraphs and under 1200 characters.
- Keep each objective short and concrete.
- Every string must be valid JSON with escaped internal quotes/newlines.
- Use this short user description only as extra context, not as the main source:
${description?.trim() || "(none)"}

PDF text:
${pdfText}
`.trim();
}

export function buildSubjectClassificationPrompt(
  pdfText: string,
  description?: string,
) {
  return `
Classify this educational PDF content into exactly one subject:
- maths
- science
- english

Return only a JSON object with this shape:
{
  "subject": "maths" | "science" | "english",
  "bookTitle": "string",
  "author": "string | null"
}

Use this short user description only as extra context:
${description?.trim() || "(none)"}

PDF text:
${pdfText}
`.trim();
}

export function buildChunkExtractionPrompt(chunkText: string, description?: string) {
  return `
Analyze this excerpt from a larger educational PDF and return JSON:
{
  "subject": "maths" | "science" | "english" | null,
  "bookTitle": "string | null",
  "author": "string | null",
  "units": [
    {
      "title": "string",
      "description": "1-2 sentence summary",
      "content": "teaching content for the section covered by this excerpt",
      "objectives": ["3 concise learning objectives"]
    }
  ]
}

Requirements:
- Return at most 1 unit for this excerpt.
- If the book title or author is visible in this excerpt, return it. Otherwise return null for missing metadata.
- Only describe sections that are actually present in this excerpt.
- Preserve source order.
- If the excerpt is only part of a section, still return the best partial section data you can.
- Ignore table of contents headings, level labels, repeated headers/footers, indexes, and generic wrappers when choosing the unit title.
- Prefer a real story/chapter/lesson title.
- Keep "description" under 200 characters.
- Keep "content" concise, ideally 1-3 short paragraphs and under 1200 characters.
- Keep each objective short and concrete.
- Every string must be valid JSON with escaped internal quotes/newlines.
- Use this short user description only as extra context:
${description?.trim() || "(none)"}

Excerpt:
${chunkText}
`.trim();
}
