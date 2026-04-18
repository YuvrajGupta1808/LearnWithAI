import type { SubjectKey } from "./constants";

export type CourseGenerationStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed";

export type GeneratedUnit = {
  title: string;
  description: string;
  content: string;
  objectives: string[];
};

export type GeneratedCourseOutline = {
  subject: SubjectKey;
  bookTitle: string;
  author: string | null;
  units: GeneratedUnit[];
};

export type PartialGeneratedCourseOutline = {
  subject: SubjectKey | null;
  bookTitle: string;
  author: string | null;
  units: GeneratedUnit[];
};
