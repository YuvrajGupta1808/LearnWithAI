import { Spectrum } from "spectrum-ts";
import { imessage } from "spectrum-ts/providers/imessage";

const DEFAULT_RECIPIENT_NUMBER = "4157408804";
const DEFAULT_CLOUD_NUMBER = "4156056081";

type PhotonApp = Awaited<ReturnType<typeof Spectrum>>;

export type PhotonConfig = {
  projectId: string;
  projectSecret: string;
  recipient: string;
  cloudLine: string;
};

declare global {
  // eslint-disable-next-line no-var
  var __photonSpectrumAppPromise: Promise<PhotonApp> | undefined;
  // eslint-disable-next-line no-var
  var __photonIMessageForwardingUnsupportedLogged: boolean | undefined;
}

export function toE164(phone: string, defaultCountryCode = "1"): string {
  const raw = phone.trim();
  const digits = raw.replace(/\D/g, "");

  if (raw.startsWith("+")) {
    return `+${digits}`;
  }

  if (raw.startsWith("00")) {
    return `+${digits.slice(2)}`;
  }

  if (digits.length === 10) {
    return `+${defaultCountryCode}${digits}`;
  }

  if (digits.length === 11 && digits.startsWith(defaultCountryCode)) {
    return `+${digits}`;
  }

  throw new Error(`Cannot normalize number to E.164 format: ${phone}`);
}

export function getPhotonConfig(): PhotonConfig | null {
  const projectId = process.env.PHOTON_PROJECT_ID?.trim();
  const projectSecret = process.env.PHOTON_PROJECT_SECRET?.trim();
  const recipient = process.env.PHOTON_IMESSAGE_RECIPIENT ?? DEFAULT_RECIPIENT_NUMBER;
  const cloudLine = process.env.PHOTON_IMESSAGE_CLOUD_LINE ?? DEFAULT_CLOUD_NUMBER;

  if (!projectId || !projectSecret) {
    return null;
  }

  return {
    projectId,
    projectSecret,
    recipient: toE164(recipient),
    cloudLine: toE164(cloudLine),
  };
}

export async function getPhotonApp(config: {
  projectId: string;
  projectSecret: string;
}) {
  if (!global.__photonSpectrumAppPromise) {
    global.__photonSpectrumAppPromise = Spectrum({
      projectId: config.projectId,
      projectSecret: config.projectSecret,
      providers: [imessage.config()],
    });
  }

  return global.__photonSpectrumAppPromise;
}

export function stripMarkdown(text: string) {
  return text
    .replace(/#{1,6}\s+/g, "")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/__(.+?)__/g, "$1")
    .replace(/_(.+?)_/g, "$1")
    .replace(/~~(.+?)~~/g, "$1")
    .replace(/`{3}[\s\S]*?`{3}/g, (match) =>
      match.replace(/`{3}\w*\n?/g, "").trim(),
    )
    .replace(/`(.+?)`/g, "$1")
    .replace(/\[(.+?)\]\((.+?)\)/g, "$1 ($2)")
    .replace(/^[-*+]\s+/gm, "• ")
    .replace(/^>\s+/gm, "")
    .trim();
}

export function splitIntoParts(text: string) {
  return stripMarkdown(text)
    .split(/\n\n+/)
    .map((part) => part.trim())
    .filter((part) => part.length > 0)
    .slice(0, 4);
}

export async function sendChatbotAnswerToIMessage(payload: {
  lessonTitle: string;
  userQuestion: string;
  assistantAnswer: string;
}) {
  const config = getPhotonConfig();

  if (!config) {
    return;
  }

  const app = await getPhotonApp(config);
  const im = imessage(app);
  const user = await im.user(config.recipient);
  const space = await im.space(user);

  const prefix = `Lesson: ${payload.lessonTitle}\nCloud line: ${config.cloudLine}\n\nQuestion: ${stripMarkdown(
    payload.userQuestion,
  )}`;
  const answerParts = splitIntoParts(payload.assistantAnswer);

  try {
    await space.send(prefix);

    for (const part of answerParts) {
      await space.send(part);
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown iMessage send failure.";

    if (message.includes("Target not allowed for this project")) {
      if (!global.__photonIMessageForwardingUnsupportedLogged) {
        global.__photonIMessageForwardingUnsupportedLogged = true;
        console.warn(
          [
            "[Photon iMessage] Forwarding skipped:",
            "your project cannot send to this target yet.",
            "Provision/assign an allowed iMessage line or shared user in Photon,",
            "then retry with PHOTON_IMESSAGE_RECIPIENT set to that allowed target.",
          ].join(" "),
        );
      }

      return;
    }

    throw error;
  }
}
