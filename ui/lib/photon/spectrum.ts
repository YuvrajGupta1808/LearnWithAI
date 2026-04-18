import { Spectrum } from "spectrum-ts";
import { imessage } from "spectrum-ts/providers/imessage";

let cloudSpectrumAppPromise: Promise<Awaited<ReturnType<typeof Spectrum>>> | null =
  null;
let localSpectrumAppPromise: Promise<Awaited<ReturnType<typeof Spectrum>>> | null =
  null;

function getEnvOrThrow(key: "PHOTON_PROJECT_ID" | "PHOTON_PROJECT_SECRET") {
  const value = process.env[key];

  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  return value;
}

function getCloudSpectrumApp() {
  if (!cloudSpectrumAppPromise) {
    cloudSpectrumAppPromise = Spectrum({
      projectId: getEnvOrThrow("PHOTON_PROJECT_ID"),
      projectSecret: getEnvOrThrow("PHOTON_PROJECT_SECRET"),
      providers: [imessage.config()],
    });
  }

  return cloudSpectrumAppPromise;
}

function getLocalSpectrumApp() {
  if (!localSpectrumAppPromise) {
    localSpectrumAppPromise = Spectrum({
      providers: [imessage.config({ local: true })],
    });
  }

  return localSpectrumAppPromise;
}

async function sendWithApp(
  appPromise: Promise<Awaited<ReturnType<typeof Spectrum>>>,
  phoneNumber: string,
  text: string,
) {
  const app = await appPromise;
  const iMessage = imessage(app);
  const user = await iMessage.user(phoneNumber);
  const space = await iMessage.space(user);

  await space.send(text);
}

type SendMode = "cloud" | "local";

type SendResult = {
  mode: SendMode;
};

function prefersLocalOnly() {
  return process.env.PHOTON_IMESSAGE_MODE === "local";
}

function localFallbackEnabled() {
  return process.env.PHOTON_LOCAL_FALLBACK === "true";
}

function isTargetBlockedError(error: unknown) {
  if (!(error instanceof Error)) {
    return false;
  }

  return error.message.toLowerCase().includes("target not allowed for this project");
}

export async function sendIMessageToPhone(
  phoneNumber: string,
  text: string,
): Promise<SendResult> {
  if (prefersLocalOnly()) {
    await sendWithApp(getLocalSpectrumApp(), phoneNumber, text);
    return { mode: "local" };
  }

  try {
    await sendWithApp(getCloudSpectrumApp(), phoneNumber, text);
    return { mode: "cloud" };
  } catch (error) {
    if (!localFallbackEnabled() || !isTargetBlockedError(error)) {
      throw error;
    }

    await sendWithApp(getLocalSpectrumApp(), phoneNumber, text);
    return { mode: "local" };
  }
}
