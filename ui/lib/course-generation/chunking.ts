import { MAX_FIREWORKS_CHARS_PER_CHUNK } from "./constants";

export function splitTextIntoChunks(
  text: string,
  maxChars = MAX_FIREWORKS_CHARS_PER_CHUNK,
) {
  const normalized = text.replace(/\r/g, "");
  const blocks = normalized
    .split(/\n{2,}|\f/g)
    .map((block) => block.trim())
    .filter(Boolean);

  const chunks: string[] = [];
  let current = "";

  for (const block of blocks) {
    if (block.length > maxChars) {
      if (current) {
        chunks.push(current.trim());
        current = "";
      }

      for (let index = 0; index < block.length; index += maxChars) {
        chunks.push(block.slice(index, index + maxChars).trim());
      }

      continue;
    }

    const candidate = current ? `${current}\n\n${block}` : block;

    if (candidate.length > maxChars) {
      chunks.push(current.trim());
      current = block;
      continue;
    }

    current = candidate;
  }

  if (current) {
    chunks.push(current.trim());
  }

  return chunks.length > 0 ? chunks : [normalized.slice(0, maxChars)];
}
