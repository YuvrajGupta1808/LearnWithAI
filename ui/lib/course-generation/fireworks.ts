import {
  buildChunkExtractionPrompt,
  buildSubjectClassificationPrompt,
  FIREWORKS_SYSTEM_PROMPT,
} from "./prompt";
import { splitTextIntoChunks } from "./chunking";
import {
  normalizeGeneratedOutline,
  normalizePartialOutline,
  parseJsonObject,
  normalizeSubject,
} from "./normalize";
import {
  MAX_GENERATED_UNITS,
  MAX_FIREWORKS_CHARS_PER_CHUNK,
  MIN_FIREWORKS_CHARS_PER_CHUNK,
} from "./constants";
import type {
  GeneratedCourseOutline,
  GeneratedUnit,
  PartialGeneratedCourseOutline,
} from "./types";

type FireworksMessage = {
  role: "system" | "user";
  content: string;
};

type FireworksResult = {
  content: string;
  finishReason: string | null;
};

type FireworksJsonSchema = {
  name: string;
  schema: Record<string, unknown>;
};

const unitSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    title: { type: "string" },
    description: { type: "string" },
    content: { type: "string" },
    objectives: {
      type: "array",
      items: { type: "string" },
    },
  },
  required: ["title", "description", "content", "objectives"],
} satisfies Record<string, unknown>;

const partialOutlineSchema: FireworksJsonSchema = {
  name: "partial_course_outline",
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      subject: {
        anyOf: [
          {
            type: "string",
            enum: ["maths", "science", "english"],
          },
          { type: "null" },
        ],
      },
      bookTitle: {
        anyOf: [{ type: "string" }, { type: "null" }],
      },
      author: {
        anyOf: [{ type: "string" }, { type: "null" }],
      },
      units: {
        type: "array",
        items: unitSchema,
      },
    },
    required: ["subject", "bookTitle", "author", "units"],
  },
};

const subjectOnlySchema: FireworksJsonSchema = {
  name: "course_subject",
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      subject: {
        type: "string",
        enum: ["maths", "science", "english"],
      },
      bookTitle: {
        type: "string",
      },
      author: {
        anyOf: [{ type: "string" }, { type: "null" }],
      },
    },
    required: ["subject", "bookTitle", "author"],
  },
};

function getFireworksConfig() {
  const apiKey = process.env.FIREWORKS_API_KEY;
  const model = process.env.FIREWORKS_MODEL;
  const apiUrl =
    process.env.FIREWORKS_API_URL ||
    "https://api.fireworks.ai/inference/v1/chat/completions";

  if (!apiKey || !model) {
    throw new Error("FIREWORKS_API_KEY and FIREWORKS_MODEL must be set.");
  }

  return { apiKey, model, apiUrl };
}

function readAssistantContent(payload: Record<string, unknown>) {
  const choices = Array.isArray(payload.choices) ? payload.choices : [];
  const firstChoice = choices[0];

  if (!firstChoice || typeof firstChoice !== "object") {
    throw new Error("Fireworks did not return any choices.");
  }

  const finishReason =
    typeof (firstChoice as { finish_reason?: unknown }).finish_reason === "string"
      ? ((firstChoice as { finish_reason?: string }).finish_reason ?? null)
      : null;

  const message = (firstChoice as { message?: unknown }).message;

  if (!message || typeof message !== "object") {
    throw new Error("Fireworks choice did not contain a message.");
  }

  const content = (message as { content?: unknown }).content;

  if (typeof content === "string") {
    return {
      content,
      finishReason,
    };
  }

  if (Array.isArray(content)) {
    const text = content
      .map((item) => {
        if (!item || typeof item !== "object") {
          return "";
        }

        const maybeText = (item as { text?: unknown }).text;
        return typeof maybeText === "string" ? maybeText : "";
      })
      .join("");

    if (text) {
      return {
        content: text,
        finishReason,
      };
    }
  }

  throw new Error("Fireworks returned an unsupported message format.");
}

async function callFireworks(
  messages: FireworksMessage[],
  responseSchema?: FireworksJsonSchema,
) {
  const { apiKey, model, apiUrl } = getFireworksConfig();

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      max_tokens: 4096,
      messages,
      ...(responseSchema
        ? {
            response_format: {
              type: "json_schema",
              json_schema: responseSchema,
            },
          }
        : {}),
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Fireworks request failed. ${errorText}`);
  }

  const payload = (await response.json()) as Record<string, unknown>;
  return readAssistantContent(payload);
}

async function parseStructuredFireworksResponse(
  messages: FireworksMessage[],
  responseSchema: FireworksJsonSchema,
) {
  const result = await callFireworks(messages, responseSchema);

  try {
    return parseJsonObject(result.content);
  } catch (error) {
    if (result.finishReason === "length") {
      throw new Error(
        "Fireworks response was truncated before completing valid JSON. The generated course outline is too large for one response.",
      );
    }

    throw error;
  }
}

function dedupeUnits(units: GeneratedUnit[]) {
  const seen = new Set<string>();

  return units.filter((unit) => {
    const key = `${unit.title.toLowerCase()}::${unit.content
      .slice(0, 160)
      .toLowerCase()}`;

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function chooseSubject(candidates: PartialGeneratedCourseOutline[]) {
  const counts = new Map<string, number>();

  for (const candidate of candidates) {
    if (!candidate.subject) {
      continue;
    }

    counts.set(candidate.subject, (counts.get(candidate.subject) ?? 0) + 1);
  }

  const sorted = Array.from(counts.entries()).sort(
    (left, right) => right[1] - left[1],
  );
  return normalizeSubject(sorted[0]?.[0] ?? null);
}

async function classifySubject(
  pdfText: string,
  description?: string,
) {
  const json = await parseStructuredFireworksResponse(
    [
      {
        role: "system",
        content: FIREWORKS_SYSTEM_PROMPT,
      },
      {
        role: "user",
        content: buildSubjectClassificationPrompt(
          pdfText.slice(0, MAX_FIREWORKS_CHARS_PER_CHUNK),
          description,
        ),
      },
    ],
    subjectOnlySchema,
  );

  const subject = normalizeSubject((json as { subject?: unknown }).subject);
  const bookTitle =
    typeof (json as { bookTitle?: unknown }).bookTitle === "string"
      ? (json as { bookTitle: string }).bookTitle.trim()
      : "";
  const author =
    typeof (json as { author?: unknown }).author === "string"
      ? (json as { author: string }).author.trim()
      : null;

  if (!subject || !bookTitle) {
    throw new Error("The model did not return valid course metadata.");
  }

  return {
    subject,
    bookTitle,
    author,
  };
}

async function extractChunkCandidates(
  chunkText: string,
  description?: string,
  chunkSize = MAX_FIREWORKS_CHARS_PER_CHUNK,
) {
  try {
    const json = await parseStructuredFireworksResponse(
      [
        {
          role: "system",
          content: FIREWORKS_SYSTEM_PROMPT,
        },
        {
          role: "user",
          content: buildChunkExtractionPrompt(chunkText, description),
        },
      ],
      partialOutlineSchema,
    );

    return [normalizePartialOutline(json)];
  } catch (error) {
    const message = error instanceof Error ? error.message : "";

    if (
      !message.includes("truncated") ||
      chunkText.length <= MIN_FIREWORKS_CHARS_PER_CHUNK
    ) {
      throw error;
    }

    const smallerChunkSize = Math.max(
      MIN_FIREWORKS_CHARS_PER_CHUNK,
      Math.floor(chunkSize / 2),
    );

    const smallerChunks = splitTextIntoChunks(chunkText, smallerChunkSize);
    const nestedCandidates: PartialGeneratedCourseOutline[] = [];

    for (const smallerChunk of smallerChunks) {
      const results = await extractChunkCandidates(
        smallerChunk,
        description,
        smallerChunkSize,
      );
      nestedCandidates.push(...results);
    }

    return nestedCandidates;
  }
}

async function buildOutlineFromCandidates(
  candidates: PartialGeneratedCourseOutline[],
  pdfText: string,
  description?: string,
) {
  const units = dedupeUnits(candidates.flatMap((candidate) => candidate.units))
    .slice(0, MAX_GENERATED_UNITS);
  const metadata = await classifySubject(pdfText, description);
  const subject = chooseSubject(candidates) ?? metadata.subject;

  return normalizeGeneratedOutline({
    subject,
    bookTitle: metadata.bookTitle,
    author: metadata.author,
    units,
  });
}

export async function generateCourseOutline(
  pdfText: string,
  description?: string,
): Promise<GeneratedCourseOutline> {
  const chunks = splitTextIntoChunks(pdfText);
  const candidates: PartialGeneratedCourseOutline[] = [];

  for (const chunk of chunks) {
    const results = await extractChunkCandidates(chunk, description);
    candidates.push(...results);

    const currentUnitCount = dedupeUnits(
      candidates.flatMap((candidate) => candidate.units),
    ).length;

    if (currentUnitCount >= MAX_GENERATED_UNITS) {
      break;
    }
  }

  if (candidates.length === 0) {
    throw new Error("The PDF chunks did not produce any candidate units.");
  }

  return buildOutlineFromCandidates(candidates, pdfText, description);
}
