"use client";

import { FormEvent, useMemo, useState } from "react";
import {
  CheckCircle2,
  MessageCircle,
  RotateCcw,
  SendHorizontal,
  Trophy,
} from "lucide-react";

import { Button } from "@/components/ui/button";

type Props = {
  lessonId: number;
  lessonTitle: string;
};

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
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

const FALLBACK_ERROR_MESSAGE =
  "I could not answer right now. Please try again in a moment.";
const BOLD_MARKDOWN_REGEX = /\*\*(.+?)\*\*/g;
const CHAT_REQUEST_TIMEOUT_MS = 45000;

function renderInlineText(text: string) {
  const chunks = text.split(BOLD_MARKDOWN_REGEX);

  return chunks.map((chunk, index) => {
    if (index % 2 === 1) {
      return (
        <strong key={`bold-${index}`} className="font-semibold text-neutral-800">
          {chunk}
        </strong>
      );
    }

    return <span key={`text-${index}`}>{chunk}</span>;
  });
}

function renderParsedMessage(content: string) {
  const lines = content.replace(/\r\n/g, "\n").split("\n");

  return (
    <div className="space-y-1.5">
      {lines.map((line, index) => {
        const trimmedLine = line.trim();

        if (!trimmedLine) {
          return <div key={`spacer-${index}`} className="h-1.5" />;
        }

        const bulletMatch = trimmedLine.match(/^[-*]\s+(.*)$/);

        if (bulletMatch) {
          return (
            <div key={`bullet-${index}`} className="flex items-start gap-2">
              <span className="mt-[3px] text-neutral-400">•</span>
              <p>{renderInlineText(bulletMatch[1])}</p>
            </div>
          );
        }

        return <p key={`line-${index}`}>{renderInlineText(trimmedLine)}</p>;
      })}
    </div>
  );
}

export const LessonChat = ({ lessonId, lessonTitle }: Props) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: `Ask me anything about "${lessonTitle}" and I will explain it simply.`,
    },
  ]);
  const [input, setInput] = useState("");
  const [pendingCount, setPendingCount] = useState(0);
  const [quiz, setQuiz] = useState<LessonQuiz | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  const isLoading = pendingCount > 0;

  const canSend = useMemo(() => {
    return input.trim().length > 0;
  }, [input]);

  const quizScore = useMemo(() => {
    if (!quiz) {
      return 0;
    }

    return quiz.questions.reduce((score, question) => {
      const selected = quizAnswers[question.id];
      return selected === question.answerIndex ? score + 1 : score;
    }, 0);
  }, [quiz, quizAnswers]);

  const allQuizAnswered = useMemo(() => {
    if (!quiz) {
      return false;
    }

    return quiz.questions.every((question) => question.id in quizAnswers);
  }, [quiz, quizAnswers]);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const question = input.trim();

    if (!question) {
      return;
    }

    const nextMessages: ChatMessage[] = [
      ...messages,
      { role: "user", content: question },
    ];

    setMessages(nextMessages);
    setInput("");
    setPendingCount((count) => count + 1);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CHAT_REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch("/api/lesson-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        signal: controller.signal,
        body: JSON.stringify({
          lessonId,
          messages: nextMessages,
        }),
      });
      clearTimeout(timeoutId);

      const data = (await response.json()) as {
        message?: string;
        quiz?: LessonQuiz | null;
        error?: string;
      };

      if (!response.ok || !data.message) {
        throw new Error(data.error || "Unable to generate answer.");
      }

      setMessages((prev) => [...prev, { role: "assistant", content: data.message! }]);
      if (data.quiz) {
        setQuiz(data.quiz);
        setQuizAnswers({});
        setQuizSubmitted(false);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: FALLBACK_ERROR_MESSAGE },
      ]);
    } finally {
      clearTimeout(timeoutId);
      setPendingCount((count) => Math.max(0, count - 1));
    }
  };

  const onChooseQuizOption = (questionId: string, optionIndex: number) => {
    if (quizSubmitted) {
      return;
    }

    setQuizAnswers((prev) => ({
      ...prev,
      [questionId]: optionIndex,
    }));
  };

  const submitQuiz = () => {
    if (!quiz || !allQuizAnswered) {
      return;
    }

    setQuizSubmitted(true);
  };

  const resetQuiz = () => {
    setQuiz(null);
    setQuizAnswers({});
    setQuizSubmitted(false);
  };

  return (
    <section className="rounded-3xl border border-neutral-200/80 bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.06)]">
      <div className="flex items-start gap-3">
        <div className="flex items-center gap-2">
          <div className="rounded-full border border-orange-200 bg-orange-50 p-2">
            <MessageCircle className="h-4 w-4 text-orange-500" />
          </div>
          <h3 className="line-clamp-2 text-base font-semibold text-neutral-800">
            {lessonTitle}
          </h3>
        </div>
      </div>

      <div className="mt-4 max-h-[430px] space-y-2 overflow-y-auto rounded-2xl border border-neutral-200 bg-neutral-50/60 p-3 pr-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:w-0">
        {messages.map((message, index) => (
          <div
            key={`${message.role}-${index}`}
            className={`flex flex-col gap-1 rounded-2xl border p-3 text-sm leading-relaxed shadow-[0_1px_2px_rgba(15,23,42,0.03)] ${
              message.role === "user"
                ? "ml-8 border-orange-200 bg-orange-50/70 text-neutral-800"
                : "mr-8 border-neutral-200 bg-white text-neutral-700"
            }`}
          >
            <span
              className={`text-[10px] font-semibold uppercase tracking-wide ${
                message.role === "user" ? "text-orange-600" : "text-neutral-500"
              }`}
            >
              {message.role === "user" ? "You" : "Tutor"}
            </span>
            <div className="text-[15px] leading-relaxed">
              {renderParsedMessage(message.content)}
            </div>
          </div>
        ))}
        {isLoading ? (
          <div className="mr-8 rounded-2xl border border-neutral-200 bg-white p-3 text-sm text-neutral-500">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-neutral-500">
              Tutor
            </span>
            <p className="mt-1">Thinking...</p>
          </div>
        ) : null}
        {quiz ? (
          <div className="mr-8 rounded-2xl border border-neutral-200 bg-white p-3 text-sm text-neutral-700 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-neutral-500">
              Tutor
            </span>

            <div className="mt-2 space-y-3">
              <p className="text-sm font-semibold text-neutral-700">{quiz.title}</p>

              {quizSubmitted ? (
                <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">
                  <Trophy className="h-4 w-4" />
                  Score: {quizScore}/{quiz.questions.length}
                </div>
              ) : null}

              {quiz.questions.map((question, index) => (
                <div
                  key={question.id}
                  className="rounded-xl border border-neutral-200 bg-neutral-50/50 p-3"
                >
                  <p className="text-sm font-semibold text-neutral-700">
                    {index + 1}. {question.question}
                  </p>

                  <div className="mt-2 grid gap-2">
                    {question.options.map((option, optionIndex) => {
                      const selected = quizAnswers[question.id] === optionIndex;
                      const isCorrect = optionIndex === question.answerIndex;
                      const shouldHighlightCorrect = quizSubmitted && isCorrect;
                      const shouldHighlightWrong =
                        quizSubmitted && selected && !isCorrect;

                      return (
                        <button
                          key={`${question.id}-${optionIndex}`}
                          type="button"
                          onClick={() => onChooseQuizOption(question.id, optionIndex)}
                          disabled={quizSubmitted}
                          className={`rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                            shouldHighlightCorrect
                              ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                              : shouldHighlightWrong
                                ? "border-rose-300 bg-rose-50 text-rose-700"
                                : selected
                                  ? "border-orange-300 bg-orange-50 text-neutral-700"
                                  : "border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50"
                          }`}
                        >
                          {option}
                        </button>
                      );
                    })}
                  </div>

                  {quizSubmitted ? (
                    <div className="mt-2 flex items-start gap-2 rounded-lg border border-neutral-200 bg-white px-2.5 py-2 text-xs text-neutral-600">
                      <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 text-neutral-500" />
                      <p>{question.explanation}</p>
                    </div>
                  ) : null}
                </div>
              ))}

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="h-10 flex-1 border-b-4 text-xs active:border-b-2"
                  onClick={submitQuiz}
                  disabled={!allQuizAnswered || quizSubmitted}
                >
                  Check Answers
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-10 border border-neutral-200 text-xs"
                  onClick={resetQuiz}
                >
                  <RotateCcw className="mr-1 h-3.5 w-3.5" />
                  Clear
                </Button>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <form onSubmit={onSubmit} className="mt-4 space-y-3">
        <div className="rounded-2xl border border-neutral-200 bg-white px-3 py-2 transition-colors focus-within:border-orange-300 focus-within:ring-2 focus-within:ring-orange-100">
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Ask about this chapter..."
            className="min-h-[54px] w-full resize-none bg-transparent text-sm leading-relaxed text-neutral-700 outline-none placeholder:text-neutral-400"
            maxLength={1500}
          />
          <div className="mt-1 text-right text-[11px] font-medium text-neutral-400">
            {input.length}/1500
          </div>
        </div>
        <Button
          type="submit"
          variant="secondary"
          size="sm"
          className="h-11 w-full border-b-4 text-sm active:border-b-2"
          disabled={!canSend}
        >
          <SendHorizontal className="mr-2 h-4 w-4" />
          {isLoading ? "Send (thinking...)" : "Send"}
        </Button>
      </form>
    </section>
  );
};
