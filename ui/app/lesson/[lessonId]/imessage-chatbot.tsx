"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Loader2, Send } from "lucide-react";

import { Button } from "@/components/ui/button";

type ChatMessage = {
  id: string;
  role: "user" | "system";
  text: string;
};

type StatusState = {
  loading: boolean;
  type: "shared" | "dedicated" | null;
  hasLine: boolean;
  senderNumber: string | null;
};

function createId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export const IMessageChatbot = () => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [status, setStatus] = useState<StatusState>({
    loading: true,
    type: null,
    hasLine: false,
    senderNumber: null,
  });

  const canSend = useMemo(
    () => phoneNumber.trim().length > 0 && draft.trim().length > 0 && !isSending,
    [draft, isSending, phoneNumber],
  );

  useEffect(() => {
    let active = true;

    const loadStatus = async () => {
      try {
        const response = await fetch("/api/imessage/status");
        const data = (await response.json()) as {
          type?: "shared" | "dedicated";
          hasLine?: boolean;
          lines?: Array<{ phoneNumber?: string }>;
        };

        if (!response.ok) {
          throw new Error("Status unavailable");
        }

        if (!active) {
          return;
        }

        setStatus({
          loading: false,
          type: data.type ?? null,
          hasLine: Boolean(data.hasLine),
          senderNumber: data.lines?.[0]?.phoneNumber ?? null,
        });
      } catch {
        if (!active) {
          return;
        }

        setStatus({
          loading: false,
          type: null,
          hasLine: false,
          senderNumber: null,
        });
      }
    };

    loadStatus();

    return () => {
      active = false;
    };
  }, []);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!canSend) {
      return;
    }

    const text = draft.trim();
    const number = phoneNumber.trim();

    const nextMessage: ChatMessage = {
      id: createId(),
      role: "user",
      text,
    };

    setMessages((current) => [...current, nextMessage]);
    setDraft("");
    setIsSending(true);

    try {
      const response = await fetch("/api/imessage/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phoneNumber: number,
          text,
        }),
      });

      const data = (await response.json()) as {
        error?: string;
        mode?: "cloud" | "local" | "redirect";
        url?: string;
        note?: string;
      };

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to send iMessage.");
      }

      const modeLabel = data.mode === "local" ? "local iMessage" : "Photon cloud";
      setMessages((current) => [
        ...current,
        {
          id: createId(),
          role: "system",
          text:
            data.mode === "redirect"
              ? data.note ?? "Opening iMessage compose..."
              : `Accepted by ${modeLabel}.`,
        },
      ]);

      if (data.mode === "redirect" && data.url) {
        window.location.assign(data.url);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to send.";

      setMessages((current) => [
        ...current,
        {
          id: createId(),
          role: "system",
          text: message,
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <section className="rounded-2xl border-2 border-black bg-white p-4 shadow-sm">
      <div className="mb-3 border-b border-black pb-3">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black">
          iMessage Chat
        </p>
        <p className="mt-1 text-sm text-neutral-700">
          Minimal sender wired to Photon.
        </p>
        <p className="mt-2 text-xs text-neutral-600">
          {status.loading
            ? "Checking Photon status..."
            : status.hasLine
              ? `Photon ready (${status.type ?? "unknown"}). Sender: ${status.senderNumber ?? "line assigned"}.`
              : `Photon ${status.type ?? "unknown"} mode: no iMessage line assigned yet.`}
        </p>
      </div>

      <div className="mb-3 h-48 overflow-y-auto rounded-xl border border-black p-3">
        {messages.length === 0 ? (
          <p className="text-sm text-neutral-500">
            Add a number and send your first message.
          </p>
        ) : (
          <div className="space-y-2">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`rounded-lg border px-3 py-2 text-sm ${
                  message.role === "user"
                    ? "border-black bg-black text-white"
                    : "border-neutral-300 bg-white text-black"
                }`}
              >
                {message.text}
              </div>
            ))}
          </div>
        )}
      </div>

      <form className="space-y-2" onSubmit={onSubmit}>
        <input
          value={phoneNumber}
          onChange={(event) => setPhoneNumber(event.target.value)}
          placeholder="+1234567890"
          className="h-10 w-full rounded-lg border border-black bg-white px-3 text-sm text-black outline-none placeholder:text-neutral-500 focus:ring-2 focus:ring-black"
          autoComplete="off"
        />
        <div className="flex gap-2">
          <input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Type a message..."
            className="h-10 flex-1 rounded-lg border border-black bg-white px-3 text-sm text-black outline-none placeholder:text-neutral-500 focus:ring-2 focus:ring-black"
          />
          <Button
            type="submit"
            disabled={!canSend}
            className="h-10 min-w-10 border border-black bg-black px-3 text-white hover:bg-neutral-900 disabled:border-neutral-300 disabled:bg-neutral-100 disabled:text-neutral-500"
            title={!status.hasLine ? "Will open Messages compose fallback if cloud send is blocked." : undefined}
          >
            {isSending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => setMessages([])}
            className="h-10 border border-neutral-300 bg-white px-3 text-xs normal-case tracking-normal text-neutral-700 hover:bg-neutral-100"
          >
            Clear
          </Button>
        </div>
      </form>
    </section>
  );
};
