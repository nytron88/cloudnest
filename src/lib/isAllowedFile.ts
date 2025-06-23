import { ALLOWED_MIME_TYPES } from "@/constants/constants";

export function isAllowedFile(file: File): boolean {
  const mimeType = file.type.toLowerCase();
  const isTypeAllowed = ALLOWED_MIME_TYPES.some((type) =>
    type.endsWith("/") ? mimeType.startsWith(type) : mimeType === type
  );

  return isTypeAllowed;
}
