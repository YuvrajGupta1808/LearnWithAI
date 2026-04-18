"use client";

import { FileText, Loader2, Plus, X } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { toast } from "sonner";

import { FeedWrapper } from "@/components/feed-wrapper";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  CLIENT_POLL_INTERVAL_MS,
  MAX_DESCRIPTION_LENGTH,
  MAX_PDF_SIZE_BYTES,
} from "@/lib/course-generation/constants";

type JobStatus = "idle" | "submitting" | "processing" | "failed";

const BACKGROUND_STEPS = [
  { label: "Upload received", threshold: 10 },
  { label: "PDF text extraction", threshold: 45 },
  { label: "AI lesson generation", threshold: 70 },
  { label: "Saving course", threshold: 90 },
] as const;

const MAX_STATUS_POLL_RETRIES = 3;

function formatElapsed(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (minutes === 0) {
    return `${seconds}s`;
  }

  return `${minutes}m ${seconds.toString().padStart(2, "0")}s`;
}

async function readJsonPayload<T>(response: Response): Promise<T | null> {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

export default function AddCoursePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const failedPollCountRef = useRef(0);
  const [description, setDescription] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [status, setStatus] = useState<JobStatus>("idle");
  const [jobId, setJobId] = useState<number | null>(null);
  const [jobError, setJobError] = useState<string | null>(null);
  const [jobProgress, setJobProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);

  useEffect(() => {
    if ((status !== "submitting" && status !== "processing") || !startedAt) {
      setElapsedMs(0);
      return;
    }

    const tick = () => {
      setElapsedMs(Date.now() - startedAt);
    };

    tick();

    const intervalId = window.setInterval(tick, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [startedAt, status]);

  useEffect(() => {
    if (!jobId || status !== "processing") {
      failedPollCountRef.current = 0;
      return;
    }

    let cancelled = false;

    const pollJob = async () => {
      try {
        const response = await fetch(`/api/course-generation/status?jobId=${jobId}`, {
          cache: "no-store",
        });

        const payload = await readJsonPayload<{
          status?: string;
          progress?: number | null;
          statusMessage?: string | null;
          courseId?: number | null;
          error?: string | null;
        }>(response);

        if (cancelled) {
          return;
        }

        if (!response.ok) {
          const message = payload?.error || "Unable to check generation status.";

          if (response.status >= 500) {
            failedPollCountRef.current += 1;

            if (failedPollCountRef.current < MAX_STATUS_POLL_RETRIES) {
              setStatusMessage("Retrying generation status check...");
              return;
            }
          }

          setStatus("failed");
          setJobProgress(payload?.progress ?? 0);
          setStatusMessage(payload?.statusMessage || null);
          setJobError(message);
          toast.error(message);
          return;
        }

        failedPollCountRef.current = 0;

        if (typeof payload?.progress === "number") {
          setJobProgress(Math.min(100, Math.max(0, payload.progress)));
        }

        if (typeof payload?.statusMessage === "string" || payload?.statusMessage === null) {
          setStatusMessage(payload?.statusMessage ?? null);
        }

        if (payload?.status === "completed" && payload.courseId) {
          setJobProgress(100);
          setStatusMessage(payload.statusMessage || "Course ready. Redirecting now.");
          router.push(`/learn/${payload.courseId}`);
          router.refresh();
          return;
        }

        if (payload?.status === "failed") {
          const message = payload.error || "Course generation failed.";
          setStatus("failed");
          setJobProgress(payload?.progress ?? 100);
          setStatusMessage(payload?.statusMessage || null);
          setJobError(message);
          toast.error(message);
        }
      } catch (error) {
        if (cancelled) {
          return;
        }

        const message =
          error instanceof Error
            ? error.message
            : "Unable to check generation status.";

        failedPollCountRef.current += 1;

        if (failedPollCountRef.current < MAX_STATUS_POLL_RETRIES) {
          setStatusMessage("Retrying generation status check...");
          return;
        }

        setStatus("failed");
        setJobProgress(100);
        setStatusMessage("Generation failed.");
        setJobError(message);
        toast.error(message);
      }
    };

    void pollJob();

    const intervalId = window.setInterval(() => {
      void pollJob();
    }, CLIENT_POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [jobId, router, status]);

  const onFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;

    if (!file) {
      setSelectedFile(null);
      return;
    }

    const isPdf =
      file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");

    if (!isPdf) {
      toast.error("Only PDF uploads are supported.");
      event.target.value = "";
      return;
    }

    if (file.size > MAX_PDF_SIZE_BYTES) {
      toast.error("PDFs must be 10MB or smaller.");
      event.target.value = "";
      return;
    }

    setSelectedFile(file);
    setStatus("idle");
    setJobId(null);
    setJobError(null);
    setJobProgress(0);
    setStatusMessage(null);
    setStartedAt(null);
    failedPollCountRef.current = 0;
  };

  const clearFile = () => {
    setSelectedFile(null);
    setStatus("idle");
    setJobId(null);
    setJobError(null);
    setJobProgress(0);
    setStatusMessage(null);
    setStartedAt(null);
    failedPollCountRef.current = 0;

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const onSubmit = async () => {
    if (!selectedFile || status === "submitting" || status === "processing") {
      return;
    }

    setStatus("submitting");
    setJobError(null);
    setJobProgress(5);
    setStatusMessage("Uploading PDF.");
    setStartedAt(Date.now());
    failedPollCountRef.current = 0;

    try {
      const formData = new FormData();
      formData.append("description", description.trim());
      formData.append("file", selectedFile);

      const response = await fetch("/api/course-generation", {
        method: "POST",
        body: formData,
      });

      const payload = (await readJsonPayload<{
        jobId?: number;
        error?: string;
      }>(response)) ?? null;

      if (!response.ok || !payload?.jobId) {
        throw new Error(payload?.error || "Failed to start course generation.");
      }

      setJobId(payload.jobId);
      setStatus("processing");
      setJobProgress(10);
      setStatusMessage("PDF uploaded. Waiting to start generation.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to start course generation.";

      setStatus("failed");
      setJobProgress(100);
      setStatusMessage("Generation failed.");
      setJobError(message);
      toast.error(message);
    }
  };

  const isBusy = status === "submitting" || status === "processing";
  const elapsedLabel =
    (status === "submitting" || status === "processing") && startedAt
      ? formatElapsed(elapsedMs)
      : null;

  return (
    <div className="flex w-full px-6 sm:px-10 pt-10 max-w-[600px] mx-auto">
      <FeedWrapper>
        <div className="w-full flex flex-col items-center">
          <Image src="/hero.svg" alt="Hero" height={120} width={120} />
          <h1 className="text-center font-bold text-neutral-800 text-xl my-4">
            Create a New Course
          </h1>
          <p className="text-muted-foreground text-center text-base mb-4">
            Upload one PDF and add a short description if needed. The system will
            detect whether it belongs to Maths, Science, or English automatically.
          </p>
        </div>

        <div className="w-full space-y-4">
          <div className="flex flex-col gap-y-4 pt-2 w-full">
            <div className="space-y-2">
              <h2 className="font-bold text-neutral-700 text-lg">Short Description</h2>
              <textarea
                value={description}
                onChange={(event) =>
                  setDescription(event.target.value.slice(0, MAX_DESCRIPTION_LENGTH))
                }
                placeholder="Optional context for the model. For example: focus on beginner-friendly explanations."
                className="w-full bg-slate-50 hover:bg-white rounded-2xl p-5 border-2 border-slate-200 focus:border-orange-400 focus:bg-white focus:outline-none transition min-h-[160px] text-base text-neutral-700 resize-none shadow-sm"
              />
              <p className="text-sm text-slate-400 text-right">
                {description.length}/{MAX_DESCRIPTION_LENGTH}
              </p>
            </div>

            <div className="space-y-4 mt-4">
              <h2 className="font-bold text-neutral-700 text-lg">Upload PDF</h2>
              <label
                htmlFor="file-upload"
                className="bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold h-12 px-6 rounded-xl flex items-center justify-center gap-x-2 cursor-pointer transition shadow-sm w-fit"
              >
                <Plus className="h-5 w-5" strokeWidth={2.5} />
                Add PDF
                <input
                  ref={fileInputRef}
                  id="file-upload"
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={onFileChange}
                />
              </label>

              {selectedFile && (
                <div className="flex items-center justify-between gap-x-3 rounded-2xl border-2 border-slate-200 bg-white px-4 py-3">
                  <div className="flex items-center gap-x-3 min-w-0">
                    <div className="rounded-xl bg-orange-50 p-2 text-orange-500">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-neutral-700 truncate">{selectedFile.name}</p>
                      <p className="text-sm text-slate-400">
                        {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={clearFile}
                    className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-500"
                    aria-label="Remove PDF"
                    disabled={isBusy}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>

            <Button
              variant="secondary"
              className="w-full mt-2"
              size="lg"
              onClick={onSubmit}
              disabled={!selectedFile || isBusy}
            >
              {isBusy ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {status === "processing" ? "Generating Course" : "Submitting"}
                </>
              ) : (
                "Submit Course"
              )}
            </Button>

            {(status === "submitting" || status === "processing" || status === "failed") && (
              <div className="mt-4 rounded-3xl border-2 border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-orange-500">
                      Background Progress
                    </p>
                    <h3 className="mt-2 text-lg font-bold text-neutral-800">
                      {status === "failed"
                        ? "Course generation stopped"
                        : status === "submitting"
                          ? "Uploading your PDF"
                          : "Generating your course"}
                    </h3>
                  </div>
                  {elapsedLabel && (
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
                      {elapsedLabel}
                    </span>
                  )}
                </div>

                <div className="mt-4">
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="font-medium text-neutral-700">
                      {statusMessage || "Preparing generation job."}
                    </span>
                    <span className="font-bold text-neutral-500">{jobProgress}%</span>
                  </div>
                  <Progress value={jobProgress} className="h-3 bg-slate-100" />
                </div>

                <div className="mt-5 grid gap-3">
                  {BACKGROUND_STEPS.map((step, index) => {
                    const reached = jobProgress >= step.threshold;
                    const active =
                      !reached &&
                      (index === 0 || jobProgress >= BACKGROUND_STEPS[index - 1].threshold);

                    return (
                      <div
                        key={step.label}
                        className="flex items-center gap-3 rounded-2xl border border-slate-200 px-3 py-3"
                      >
                        <div
                          className={[
                            "flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition",
                            reached
                              ? "bg-orange-500 text-white"
                              : active
                                ? "bg-orange-100 text-orange-600"
                                : "bg-slate-100 text-slate-400",
                          ].join(" ")}
                        >
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-semibold text-neutral-700">{step.label}</p>
                          <p className="text-xs text-slate-400">
                            {reached
                              ? "Done"
                              : active
                                ? "In progress"
                                : "Waiting"}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {jobError && (
                  <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">
                    {jobError}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </FeedWrapper>
    </div>
  );
}
