import JSON5 from "json5";

import {
  MAX_GENERATED_UNITS,
  SUBJECTS,
  type SubjectKey,
} from "./constants";
import type {
  GeneratedCourseOutline,
  GeneratedUnit,
  PartialGeneratedCourseOutline,
} from "./types";

const MAX_TITLE_LENGTH = 120;
const MAX_BOOK_TITLE_LENGTH = 160;
const MAX_AUTHOR_LENGTH = 120;
const MAX_DESCRIPTION_LENGTH = 180;
const MAX_CONTENT_LENGTH = 900;
const MAX_OBJECTIVE_LENGTH = 120;

function normalizeWhitespace(value: string) {
  return value.replace(/\r/g, "").replace(/[ \t]+\n/g, "\n").trim();
}

function takeString(value: unknown, fallback = "") {
  if (typeof value !== "string") {
    return fallback;
  }

  return normalizeWhitespace(value);
}

function truncateText(value: string, maxLength: number) {
  if (value.length <= maxLength) {
    return value;
  }

  const sentenceMatch = value
    .slice(0, maxLength + 1)
    .match(/^([\s\S]{0,900}?[.!?])(?:\s|$)/);

  if (sentenceMatch?.[1]) {
    return sentenceMatch[1].trim();
  }

  return `${value.slice(0, Math.max(0, maxLength - 1)).trim()}…`;
}

function takeObjectives(value: unknown) {
  if (Array.isArray(value)) {
    return value
      .map((item) => takeString(item))
      .map((item) => truncateText(item, MAX_OBJECTIVE_LENGTH))
      .filter(Boolean)
      .slice(0, 3);
  }

  if (typeof value === "string") {
    return value
      .split(/\n|,/)
      .map((item) => item.replace(/^[-*]\s*/, "").trim())
      .map((item) => truncateText(item, MAX_OBJECTIVE_LENGTH))
      .filter(Boolean)
      .slice(0, 3);
  }

  return [];
}

export function normalizeSubject(rawSubject: unknown): SubjectKey | null {
  if (typeof rawSubject !== "string") {
    return null;
  }

  const value = rawSubject.trim().toLowerCase();

  if (value in SUBJECTS) {
    return value as SubjectKey;
  }

  if (["math", "mathematics", "algebra", "geometry", "calculus"].includes(value)) {
    return "maths";
  }

  if (["science", "biology", "chemistry", "physics"].includes(value)) {
    return "science";
  }

  if (["english", "language arts", "ela", "literature", "grammar"].includes(value)) {
    return "english";
  }

  return null;
}

function normalizeUnit(value: unknown) {
  if (!value || typeof value !== "object") {
    return null;
  }

  const raw = value as Record<string, unknown>;
  const title = truncateText(takeString(raw.title), MAX_TITLE_LENGTH);
  const description = truncateText(
    takeString(raw.description),
    MAX_DESCRIPTION_LENGTH,
  );
  const content = truncateText(
    takeString(raw.content, description),
    MAX_CONTENT_LENGTH,
  );
  const objectives = takeObjectives(raw.objectives);

  if (!title || !content) {
    return null;
  }

  const unit: GeneratedUnit = {
    title,
    description: description || title,
    content,
    objectives: objectives.length > 0 ? objectives : [`Understand ${title}`],
  };

  return unit;
}

function dedupeUnits(units: GeneratedUnit[]) {
  const seen = new Set<string>();

  return units.filter((unit) => {
    const key = `${unit.title.toLowerCase()}::${unit.content.slice(0, 120).toLowerCase()}`;

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function normalizeBookTitle(value: unknown) {
  const title = truncateText(takeString(value), MAX_BOOK_TITLE_LENGTH);
  return title || "Generated Course";
}

function normalizeAuthor(value: unknown) {
  const author = truncateText(takeString(value), MAX_AUTHOR_LENGTH);
  return author || null;
}

export function parseJsonObject(content: string) {
  const trimmed = content.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const raw = fenced ? fenced[1] : trimmed;
  const firstBrace = raw.indexOf("{");
  const lastBrace = raw.lastIndexOf("}");

  if (firstBrace === -1 || lastBrace === -1) {
    throw new Error("Model response did not contain a JSON object.");
  }

  const candidate = raw.slice(firstBrace, lastBrace + 1);

  try {
    return JSON.parse(candidate) as unknown;
  } catch (jsonError) {
    try {
      return JSON5.parse(candidate) as unknown;
    } catch {
      const message =
        jsonError instanceof Error ? jsonError.message : "Unknown JSON parse error";

      throw new Error(`Model returned invalid JSON. ${message}`);
    }
  }
}

export function normalizePartialOutline(input: unknown): PartialGeneratedCourseOutline {
  if (!input || typeof input !== "object") {
    throw new Error("Model response was not an object.");
  }

  const raw = input as Record<string, unknown>;
  const subject = normalizeSubject(raw.subject);
  const bookTitle = normalizeBookTitle(raw.bookTitle);
  const author = normalizeAuthor(raw.author);
  const units = Array.isArray(raw.units)
    ? dedupeUnits(raw.units.map(normalizeUnit).filter(Boolean) as GeneratedUnit[])
        .slice(0, MAX_GENERATED_UNITS)
    : [];

  return {
    subject,
    bookTitle,
    author,
    units,
  };
}

export function normalizeGeneratedOutline(input: unknown): GeneratedCourseOutline {
  const normalized = normalizePartialOutline(input);

  if (!normalized.subject) {
    throw new Error("The model did not return a valid subject.");
  }

  if (normalized.units.length === 0) {
    throw new Error("The model did not return any units.");
  }

  return {
    subject: normalized.subject,
    bookTitle: normalized.bookTitle,
    author: normalized.author,
    units: normalized.units,
  };
}
