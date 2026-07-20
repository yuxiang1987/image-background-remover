interface Env {
  REMOVE_BG_API_KEY?: string;
  TURNSTILE_SECRET_KEY?: string;
  ALLOWED_ORIGIN?: string;
}

type PagesContext = { request: Request; env: Env };
const rateLimits = new Map<string, { minute: number[]; day: number[] }>();
const MAX_FILE_SIZE = 12 * 1024 * 1024;

function jsonError(status: number, code: string, message: string, requestId: string, extraHeaders: HeadersInit = {}) {
  return Response.json({ error: { code, message, requestId } }, { status, headers: { "Cache-Control": "no-store", "X-Request-ID": requestId, ...extraHeaders } });
}

function validSignature(bytes: Uint8Array) {
  const jpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  const png = bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
  const webp = new TextDecoder().decode(bytes.slice(0, 4)) === "RIFF" && new TextDecoder().decode(bytes.slice(8, 12)) === "WEBP";
  return jpeg || png || webp;
}

export async function onRequestPost({ request, env }: PagesContext) {
  const requestId = crypto.randomUUID();
  const origin = request.headers.get("Origin");
  if (env.ALLOWED_ORIGIN && origin && origin !== env.ALLOWED_ORIGIN) return jsonError(403, "INVALID_ORIGIN", "This request origin is not allowed.", requestId);
  if (!request.headers.get("content-type")?.includes("multipart/form-data")) return jsonError(400, "INVALID_REQUEST", "Please submit an image file.", requestId);

  const ip = request.headers.get("CF-Connecting-IP") || "local";
  const now = Date.now();
  const entry = rateLimits.get(ip) || { minute: [], day: [] };
  entry.minute = entry.minute.filter((time) => now - time < 60_000);
  entry.day = entry.day.filter((time) => now - time < 86_400_000);
  if (entry.minute.length >= 5 || entry.day.length >= 30) return jsonError(429, "RATE_LIMITED", "Too many requests. Please try again later.", requestId, { "Retry-After": "60" });
  entry.minute.push(now); entry.day.push(now); rateLimits.set(ip, entry);

  let form: FormData;
  try { form = await request.formData(); } catch { return jsonError(400, "INVALID_REQUEST", "We could not read this upload.", requestId); }
  const image = form.get("image_file");
  const token = form.get("turnstile_token");
  if (!(image instanceof File)) return jsonError(400, "INVALID_REQUEST", "Please submit an image file.", requestId);
  if (image.size > MAX_FILE_SIZE) return jsonError(413, "FILE_TOO_LARGE", "Please choose an image smaller than 12 MB.", requestId);
  if (!["image/jpeg", "image/png", "image/webp"].includes(image.type)) return jsonError(400, "INVALID_IMAGE", "Please upload a valid JPG, PNG, or WebP image.", requestId);
  if (!validSignature(new Uint8Array(await image.slice(0, 12).arrayBuffer()))) return jsonError(400, "INVALID_IMAGE", "We could not read this image. Please choose another file.", requestId);

  if (env.TURNSTILE_SECRET_KEY) {
    const verification = new FormData();
    verification.append("secret", env.TURNSTILE_SECRET_KEY);
    verification.append("response", typeof token === "string" ? token : "");
    verification.append("remoteip", ip);
    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", body: verification });
    const result = await response.json() as { success?: boolean };
    if (!result.success) return jsonError(403, "VERIFICATION_FAILED", "Security verification failed. Please try again.", requestId);
  }
  if (!env.REMOVE_BG_API_KEY) return jsonError(503, "SERVICE_NOT_CONFIGURED", "Image processing is not configured yet.", requestId);

  const upstreamForm = new FormData();
  upstreamForm.append("image_file", image, "upload");
  upstreamForm.append("size", "auto");
  let upstream: Response;
  try { upstream = await fetch("https://api.remove.bg/v1.0/removebg", { method: "POST", headers: { "X-Api-Key": env.REMOVE_BG_API_KEY }, body: upstreamForm, signal: AbortSignal.timeout(28_000) }); }
  catch { return jsonError(504, "UPSTREAM_TIMEOUT", "Processing took too long. Please try again.", requestId); }

  if (!upstream.ok) {
    if (upstream.status === 429) return jsonError(429, "RATE_LIMITED", "The service is busy. Please try again shortly.", requestId, { "Retry-After": upstream.headers.get("Retry-After") || "60" });
    if (upstream.status === 402 || upstream.status === 403) return jsonError(503, "CREDITS_EXHAUSTED", "The service is temporarily unavailable. Please try again later.", requestId);
    if (upstream.status === 400 || upstream.status === 422) return jsonError(422, "SUBJECT_NOT_FOUND", "We could not find a clear subject. Please try another image.", requestId);
    return jsonError(502, "UPSTREAM_ERROR", "We could not process this image. Please try again.", requestId);
  }
  return new Response(upstream.body, { status: 200, headers: { "Content-Type": upstream.headers.get("Content-Type") || "image/png", "Cache-Control": "no-store", "X-Request-ID": requestId, "X-Content-Type-Options": "nosniff" } });
}

export function onRequest() {
  return jsonError(405, "METHOD_NOT_ALLOWED", "Only POST requests are accepted.", crypto.randomUUID(), { Allow: "POST" });
}
