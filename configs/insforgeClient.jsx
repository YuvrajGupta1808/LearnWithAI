import { createClient } from "@insforge/sdk";

const baseUrl = process.env.NEXT_PUBLIC_INSFORGE_URL;
const anonKey = process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY;

export const isInsforgeConfigured = Boolean(baseUrl && anonKey);

export const insforge = isInsforgeConfigured
  ? createClient({
      baseUrl,
      anonKey,
    })
  : null;
