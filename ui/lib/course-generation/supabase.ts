import { randomUUID } from "node:crypto";

function getSupabaseConfig() {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const bucket = process.env.SUPABASE_STORAGE_BUCKET || "course-pdfs";

  if (!url || !serviceRoleKey) {
    throw new Error(
      "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set for course generation.",
    );
  }

  return { url, serviceRoleKey, bucket };
}

function encodeStoragePath(storagePath: string) {
  return storagePath
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

function sanitizeFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, "-");
}

export function buildPdfStoragePath(userId: string, fileName: string) {
  return `${userId}/${randomUUID()}/${sanitizeFileName(fileName)}`;
}

export async function uploadPdfToSupabase(
  buffer: Buffer,
  storagePath: string,
  fileName: string,
) {
  const { url, serviceRoleKey, bucket } = getSupabaseConfig();
  const encodedPath = encodeStoragePath(storagePath);

  const response = await fetch(
    `${url}/storage/v1/object/${bucket}/${encodedPath}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${serviceRoleKey}`,
        apikey: serviceRoleKey,
        "Content-Type": "application/pdf",
        "x-upsert": "false",
        "x-content-type": "application/pdf",
        "cache-control": "3600",
      },
      body: new Uint8Array(buffer),
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Supabase upload failed for ${fileName}. ${errorText}`);
  }

  return { bucket, storagePath };
}

export async function downloadPdfFromSupabase(storagePath: string) {
  return downloadPdfFromSupabaseBucket(
    getSupabaseConfig().bucket,
    storagePath,
  );
}

export async function downloadPdfFromSupabaseBucket(
  bucket: string,
  storagePath: string,
) {
  const { url, serviceRoleKey } = getSupabaseConfig();
  const encodedPath = encodeStoragePath(storagePath);

  const response = await fetch(
    `${url}/storage/v1/object/authenticated/${bucket}/${encodedPath}`,
    {
      headers: {
        Authorization: `Bearer ${serviceRoleKey}`,
        apikey: serviceRoleKey,
      },
      cache: "no-store",
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Supabase download failed. ${errorText}`);
  }

  return Buffer.from(await response.arrayBuffer());
}
