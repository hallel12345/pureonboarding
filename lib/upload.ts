import {
  ALLOWED_UPLOAD_EXTENSIONS,
  ALLOWED_UPLOAD_MIME_TYPES,
  MAX_UPLOAD_SIZE_BYTES,
} from "./config";
import { uploadClientPayloadSchema } from "./schema";

export function sanitizeFilename(fileName: string): string {
  const trimmed = fileName.trim().toLowerCase();
  return trimmed
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9._-]/g, "")
    .replace(/-+/g, "-");
}

export function hasAllowedExtension(fileName: string): boolean {
  const lower = fileName.toLowerCase();
  return ALLOWED_UPLOAD_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

export function validateUploadPayload(rawPayload: string | null) {
  if (!rawPayload) {
    throw new Error("Missing upload client payload.");
  }

  const parsedPayload = JSON.parse(rawPayload) as unknown;
  const payload = uploadClientPayloadSchema.parse(parsedPayload);

  if (payload.size > MAX_UPLOAD_SIZE_BYTES) {
    throw new Error("File exceeds max upload size.");
  }

  if (!ALLOWED_UPLOAD_MIME_TYPES.includes(payload.mimeType)) {
    throw new Error("Unsupported file type.");
  }

  if (!hasAllowedExtension(payload.originalFileName)) {
    throw new Error("Unsupported file extension.");
  }

  return payload;
}

export function buildBlobPathname(submissionId: string, formId: string, fileName: string): string {
  const safeFileName = sanitizeFilename(fileName);
  return `onboarding/${submissionId}/${formId}/${Date.now()}-${safeFileName}`;
}
