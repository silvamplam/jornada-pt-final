export const ADMIN_SESSION_COOKIE = "jornada_admin_session";
export const ADMIN_SESSION_MAX_AGE_SECONDS = 60 * 60 * 8;

const encoder = new TextEncoder();

function getAdminSecret(): string {
  return process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD || "";
}

function toBase64Url(bytes: ArrayBuffer): string {
  const values = Array.from(new Uint8Array(bytes));
  const binary = values.map((value) => String.fromCharCode(value)).join("");

  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

function constantTimeEqual(left: string, right: string): boolean {
  if (left.length !== right.length) {
    return false;
  }

  let result = 0;

  for (let index = 0; index < left.length; index += 1) {
    result |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }

  return result === 0;
}

async function signPayload(payload: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));

  return toBase64Url(signature);
}

export function isAdminPasswordConfigured(): boolean {
  return Boolean(process.env.ADMIN_PASSWORD);
}

export async function createAdminSession(): Promise<string> {
  const secret = getAdminSecret();

  if (!secret) {
    throw new Error("ADMIN_PASSWORD is not configured.");
  }

  const payload = `v1.${Date.now()}`;
  const signature = await signPayload(payload, secret);

  return `${payload}.${signature}`;
}

export async function verifyAdminSession(value?: string): Promise<boolean> {
  const secret = getAdminSecret();

  if (!secret || !value) {
    return false;
  }

  const parts = value.split(".");

  if (parts.length !== 3 || parts[0] !== "v1") {
    return false;
  }

  const issuedAt = Number(parts[1]);

  if (!Number.isFinite(issuedAt)) {
    return false;
  }

  const expiresAt = issuedAt + ADMIN_SESSION_MAX_AGE_SECONDS * 1000;

  if (Date.now() > expiresAt) {
    return false;
  }

  const payload = `${parts[0]}.${parts[1]}`;
  const expectedSignature = await signPayload(payload, secret);

  return constantTimeEqual(parts[2], expectedSignature);
}
