import { auth } from "@clerk/nextjs";
import { AIMessage, HumanMessage, SystemMessage } from "@langchain/core/messages";
import { ChatOpenAI } from "@langchain/openai";
import { NextResponse } from "next/server";

import { getLesson } from "@/db/queries";
import { parseJsonObject } from "@/lib/course-generation/normalize";
import { startPhotonIMessageBot } from "@/lib/photon-imessage-bot";
import { sendChatbotAnswerToIMessage } from "@/lib/photon-imessage";

export const runtime = "nodejs";

const MAX_HISTORY_MESSAGES = 8;
const MAX_MESSAGE_LENGTH = 1500;
const MAX_CONTEXT_LENGTH = 8000;

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type ChatPayload = {
  lessonId?: number;
  messages?: ChatMessage[];
};

type QuizQuestion = {
  id: string;
  question: string;
  options: string[];
  answerIndex: number;
  explanation: string;
};

type LessonQuiz = {
  title: string;
  questions: QuizQuestion[];
};

type LessonChatModelResponse = {
  assistantMessage: string;
  showQuiz: boolean;
  quiz: LessonQuiz | null;
};

function sanitizeMessages(messages: unknown): ChatMessage[] {
  if (!Array.isArray(messages)) {
    return [];
  }

  return messages
    .filter((message): message is ChatMessage => {
      if (!message || typeof message !== "object") {
        return false;
      }

      const role = (message as { role?: unknown }).role;
      const content = (message as { content?: unknown }).content;

      return (
        (role === "user" || role === "assistant") &&
        typeof content === "string" &&
        content.trim().length > 0
      );
    })
    .map((message) => ({
      role: message.role,
      content: message.content.trim().slice(0, MAX_MESSAGE_LENGTH),
    }));
}

function resolveFireworksBaseUrl() {
  const configuredUrl = process.env.FIREWORKS_API_URL?.trim();

  if (!configuredUrl) {
    return "https://api.fireworks.ai/inference/v1";
  }

  return configuredUrl.replace(/\/chat\/completions\/?$/, "");
}

function normalizeModelContent(content: unknown): string {
  if (typeof content === "string") {
    return content.trim();
  }

  if (Array.isArray(content)) {
    const text = content
      .map((item) => {
        if (!item || typeof item !== "object") {
          return "";
        }

        const candidate = (item as { text?: unknown }).text;
        return typeof candidate === "string" ? candidate : "";
      })
      .join("")
      .trim();

    return text;
  }

  return "";
}

function normalizeLessonChatModelResponse(raw: unknown): LessonChatModelResponse {
  if (!raw || typeof raw !== "object") {
    throw new Error("Model response was not an object.");
  }

  const record = raw as {
    assistantMessage?: unknown;
    showQuiz?: unknown;
    quiz?: unknown;
  };

  const assistantMessage =
    typeof record.assistantMessage === "string"
      ? record.assistantMessage.trim()
      : "";

  if (!assistantMessage) {
    throw new Error("Model response did not include assistantMessage.");
  }

  const showQuiz = Boolean(record.showQuiz);

  if (!showQuiz || !record.quiz || typeof record.quiz !== "object") {
    return {
      assistantMessage,
      showQuiz: false,
      quiz: null,
    };
  }

  const quizRecord = record.quiz as {
    title?: unknown;
    questions?: unknown[];
  };

  const title =
    typeof quizRecord.title === "string" && quizRecord.title.trim()
      ? quizRecord.title.trim()
      : "Quick Lesson Quiz";

  const questions = (Array.isArray(quizRecord.questions) ? quizRecord.questions : [])
    .map((item, index) => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const questionRecord = item as {
        question?: unknown;
        options?: unknown[];
        answerIndex?: unknown;
        explanation?: unknown;
      };

      const question =
        typeof questionRecord.question === "string"
          ? questionRecord.question.trim()
          : "";
      const options = Array.isArray(questionRecord.options)
        ? questionRecord.options
            .map((option) => (typeof option === "string" ? option.trim() : ""))
            .filter(Boolean)
        : [];
      const explanation =
        typeof questionRecord.explanation === "string"
          ? questionRecord.explanation.trim()
          : "";
      const answerIndex =
        typeof questionRecord.answerIndex === "number"
          ? Math.floor(questionRecord.answerIndex)
          : -1;

      if (!question || options.length !== 4 || answerIndex < 0 || answerIndex > 3) {
        return null;
      }

      return {
        id: `q-${index + 1}`,
        question,
        options,
        answerIndex,
        explanation: explanation || "Review the lesson details and try again.",
      } satisfies QuizQuestion;
    })
    .filter((question): question is QuizQuestion => Boolean(question))
    .slice(0, 5);

  if (questions.length === 0) {
    return {
      assistantMessage,
      showQuiz: false,
      quiz: null,
    };
  }

  return {
    assistantMessage,
    showQuiz: true,
    quiz: {
      title,
      questions,
    },
  };
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!process.env.FIREWORKS_API_KEY || !process.env.FIREWORKS_MODEL) {
      return NextResponse.json(
        { error: "Fireworks is not configured on the server." },
        { status: 500 },
      );
    }

    const payload = (await request.json()) as ChatPayload;
    const lessonId = Number(payload.lessonId);

    if (Number.isNaN(lessonId)) {
      return NextResponse.json({ error: "Invalid lesson id." }, { status: 400 });
    }

    const messages = sanitizeMessages(payload.messages).slice(-MAX_HISTORY_MESSAGES);
    const lastMessage = messages[messages.length - 1];

    if (!lastMessage || lastMessage.role !== "user") {
      return NextResponse.json(
        { error: "Please send a user question." },
        { status: 400 },
      );
    }

    const lesson = await getLesson(lessonId);

    if (!lesson) {
      return NextResponse.json({ error: "Lesson not found." }, { status: 404 });
    }

    const objectivesText =
      lesson.objectives && lesson.objectives.length > 0
        ? lesson.objectives.map((item) => `- ${item}`).join("\n")
        : "No specific objectives listed.";

    const lessonContext = [
      `Lesson title: ${lesson.title}`,
      "",
      "Lesson description:",
      lesson.description || "No description provided.",
      "",
      "Lesson content:",
      lesson.content || "No content provided.",
      "",
      "Objectives:",
      objectivesText,
    ]
      .join("\n")
      .slice(0, MAX_CONTEXT_LENGTH);

    const model = new ChatOpenAI({
      model: process.env.FIREWORKS_MODEL,
      temperature: 0.1,
      maxTokens: 700,
      configuration: {
        apiKey: process.env.FIREWORKS_API_KEY,
        baseURL: resolveFireworksBaseUrl(),
      },
    });

    const modelMessages = [
      new SystemMessage(
        [
          "You are a concise and helpful study assistant.",
          "Use only the provided lesson context as your main source of truth.",
          "If the answer is not in the lesson, say so clearly and suggest what part of the lesson to review.",
          "Keep responses short, clear, and student-friendly.",
          "Decide whether the student should get a quiz right now.",
          "Set showQuiz=true only when a quiz is useful now (for example: user asks to practice/test/quiz, or user appears ready for assessment).",
          "When showQuiz=true, include a valid quiz object with 3-5 multiple choice questions.",
          "Each question must have exactly 4 options, answerIndex between 0-3, and short explanation.",
          "Return ONLY JSON with this shape:",
          "{",
          '  "assistantMessage": "string",',
          '  "showQuiz": true,',
          '  "quiz": {',
          '    "title": "string",',
          '    "questions": [',
          "      {",
          '        "question": "string",',
          '        "options": ["string", "string", "string", "string"],',
          '        "answerIndex": 0,',
          '        "explanation": "string"',
          "      }",
          "    ]",
          "  }",
          "}",
          "When showQuiz=false, set quiz to null.",
          "",
          "Lesson context:",
          lessonContext,
        ].join("\n"),
      ),
      ...messages.map((message) =>
        message.role === "assistant"
          ? new AIMessage(message.content)
          : new HumanMessage(message.content),
      ),
    ];

    const response = await model.invoke(modelMessages);
    const rawContent = normalizeModelContent(response.content);

    let modelResult: LessonChatModelResponse;

    try {
      modelResult = normalizeLessonChatModelResponse(parseJsonObject(rawContent));
    } catch {
      if (!rawContent) {
        return NextResponse.json(
          { error: "The model returned an empty response." },
          { status: 502 },
        );
      }

      modelResult = {
        assistantMessage: rawContent,
        showQuiz: false,
        quiz: null,
      };
    }

    // Ensure iMessage inbound bot starts once per server process.
    startPhotonIMessageBot().catch((error) => {
      console.error("Failed to start iMessage bot loop:", error);
    });

    // Optional: forward web-chat answers to iMessage when explicitly enabled.
    if (process.env.PHOTON_FORWARD_WEB_CHAT_TO_IMESSAGE === "true") {
      sendChatbotAnswerToIMessage({
        lessonTitle: lesson.title,
        userQuestion: lastMessage.content,
        assistantAnswer: modelResult.assistantMessage,
      }).catch((error) => {
        console.error("Failed to forward chatbot reply to iMessage:", error);
      });
    }

    return NextResponse.json({
      message: modelResult.assistantMessage,
      quiz: modelResult.showQuiz ? modelResult.quiz : null,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to generate response.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
