import { randomUUID } from "crypto";
import { NextResponse } from "next/server";

const BUCKET = "editorial-videos";
const DEFAULT_MAX_UPLOAD_MB = 45;
const allowedMimeTypes = new Map([
  [".mp4", new Set(["video/mp4"])],
  [".webm", new Set(["video/webm"])],
  [".ogg", new Set(["video/ogg", "application/ogg"])],
]);

type SignUploadPayload = {
  filename?: unknown;
  contentType?: unknown;
  size?: unknown;
};

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function jsonError(error: string, status = 400) {
  return NextResponse.json({ ok: false, error }, { status });
}

function getMaxUploadMb() {
  const rawValue = process.env.EDITORIAL_VIDEO_MAX_UPLOAD_MB?.trim();
  const parsedValue = rawValue ? Number(rawValue) : NaN;

  return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : DEFAULT_MAX_UPLOAD_MB;
}

function maxUploadBytes(maxUploadMb: number) {
  return Math.floor(maxUploadMb * 1024 * 1024);
}

function getSupabaseServiceConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!url || !serviceRoleKey) {
    return null;
  }

  return { url: url.replace(/\/$/, ""), serviceRoleKey };
}

function extensionFor(filename: string) {
  const match = filename.toLowerCase().match(/\.(mp4|webm|ogg)$/);
  return match ? `.${match[1]}` : "";
}

function safeFilename(filename: string, extension: string) {
  const base = filename
    .split(/[\\/]/)
    .pop()
    ?.replace(/\.[^.]+$/, "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

  return `${base || "video"}${extension}`;
}

function storagePath(filename: string, extension: string) {
  const now = new Date();
  const year = String(now.getUTCFullYear());
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  const unique = `${Date.now()}-${randomUUID()}`;

  return `editorial/${year}/${month}/${unique}-${safeFilename(filename, extension)}`;
}

function encodeStoragePath(path: string) {
  return path.split("/").map(encodeURIComponent).join("/");
}

function publicStorageUrl(supabaseUrl: string, bucket: string, path: string) {
  return `${supabaseUrl}/storage/v1/object/public/${encodeURIComponent(bucket)}/${encodeStoragePath(path)}`;
}

function signedUploadUrl(storageBaseUrl: string, path: string, payload: Record<string, unknown>) {
  const rawUrl = cleanText(payload.signedUrl) || cleanText(payload.signedURL) || cleanText(payload.url);
  const token = cleanText(payload.token);
  let signedUrl = rawUrl
    ? rawUrl.startsWith("http")
      ? rawUrl
      : `${storageBaseUrl}${rawUrl.startsWith("/") ? "" : "/"}${rawUrl}`
    : "";

  if (!signedUrl && token) {
    signedUrl = `${storageBaseUrl}/object/upload/sign/${encodeURIComponent(BUCKET)}/${encodeStoragePath(path)}`;
  }

  if (signedUrl && token && !/[?&]token=/.test(signedUrl)) {
    const separator = signedUrl.includes("?") ? "&" : "?";
    signedUrl = `${signedUrl}${separator}token=${encodeURIComponent(token)}`;
  }

  return { signedUrl, token };
}

export async function POST(request: Request) {
  const config = getSupabaseServiceConfig();
  if (!config) {
    return jsonError("missing-supabase-service-config", 500);
  }

  let payload: SignUploadPayload;
  try {
    payload = (await request.json()) as SignUploadPayload;
  } catch {
    return jsonError("invalid-json");
  }

  const filename = cleanText(payload.filename);
  const contentType = cleanText(payload.contentType).toLowerCase();
  const size = typeof payload.size === "number" ? payload.size : Number(payload.size);
  const extension = extensionFor(filename);
  const allowedTypes = allowedMimeTypes.get(extension);
  const maxUploadMb = getMaxUploadMb();
  const maxSize = maxUploadBytes(maxUploadMb);

  if (!filename) {
    return jsonError("missing-filename");
  }

  if (!allowedTypes || !allowedTypes.has(contentType)) {
    return jsonError("invalid-video-format");
  }

  if (!Number.isFinite(size) || size <= 0) {
    return jsonError("invalid-video-size");
  }

  if (size > maxSize) {
    return NextResponse.json({ ok: false, error: "video-too-large", maxUploadMb, maxSize }, { status: 413 });
  }

  const path = storagePath(filename, extension);
  const storageBaseUrl = `${config.url}/storage/v1`;
  const signResponse = await fetch(
    `${storageBaseUrl}/object/upload/sign/${encodeURIComponent(BUCKET)}/${encodeStoragePath(path)}`,
    {
      method: "POST",
      cache: "no-store",
      headers: {
        apikey: config.serviceRoleKey,
        Authorization: `Bearer ${config.serviceRoleKey}`,
        "Content-Type": "application/json",
        "x-upsert": "false",
      },
      body: "{}",
    },
  );

  if (!signResponse.ok) {
    const detail = await signResponse.text().catch(() => "");
    const missingBucket = signResponse.status === 404 || /bucket/i.test(detail);
    return jsonError(missingBucket ? "missing-editorial-videos-bucket" : "signed-upload-failed", missingBucket ? 404 : 502);
  }

  const signedPayload = (await signResponse.json()) as Record<string, unknown>;
  const { signedUrl, token } = signedUploadUrl(storageBaseUrl, path, signedPayload);

  if (!signedUrl) {
    return jsonError("missing-signed-upload-url", 502);
  }

  return NextResponse.json({
    ok: true,
    bucket: BUCKET,
    path,
    token,
    signedUrl,
    publicUrl: publicStorageUrl(config.url, BUCKET, path),
    maxUploadMb,
    maxSize,
  });
}
