export const SUBJECTS = {
  maths: {
    title: "Maths",
    imageSrc: "/maths.svg",
  },
  science: {
    title: "Science",
    imageSrc: "/science.svg",
  },
  english: {
    title: "English",
    imageSrc: "/english.svg",
  },
} as const;

export type SubjectKey = keyof typeof SUBJECTS;

export const JOB_STATUSES = {
  pending: "pending",
  processing: "processing",
  completed: "completed",
  failed: "failed",
} as const;

export const MAX_PDF_SIZE_BYTES = 10 * 1024 * 1024;
export const MAX_DESCRIPTION_LENGTH = 400;
export const MAX_FIREWORKS_CHARS_PER_CHUNK = 4_000;
export const MIN_FIREWORKS_CHARS_PER_CHUNK = 1_500;
export const MAX_GENERATED_UNITS = 4;
export const CLIENT_POLL_INTERVAL_MS = 3_000;
export const WORKER_POLL_INTERVAL_MS = 5_000;
