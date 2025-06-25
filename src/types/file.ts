import { FileSearchSchema } from "@/schemas/fileSearchSchema";
import { z } from "zod";
import { File as PrismaFile, FileType as PrismaFileType } from "@prisma/client";
import { FileIdParamsSchema } from "@/schemas/fileIdParamsSchema";
import { RenameFileSchema } from "@/schemas/renameFileSchema";
import { MoveFileSchema } from "@/schemas/moveFileSchema";

export type File = Omit<PrismaFile, "id" | "createdAt" | "updatedAt">;

export const FileType = PrismaFileType;
export type FileType = PrismaFileType;

export type FileSearchParams = z.infer<typeof FileSearchSchema>;

export function mapFileType(
  fileType: string,
  mimeType: string
): FileType | null {
  const mime = mimeType.toLowerCase();

  if (fileType === "image") return "IMAGE";
  if (fileType === "video") return "VIDEO";
  if (fileType === "audio") return "AUDIO";

  if (mime.includes("pdf")) return "PDF";
  if (
    mime.includes("msword") ||
    mime.includes("officedocument") ||
    mime.includes("presentation") ||
    mime.includes("spreadsheet") ||
    mime.includes("text/plain")
  ) {
    return "DOCUMENT";
  }

  return null;
}

export type FileIdParams = z.infer<typeof FileIdParamsSchema>;

export type RenameFileBody = z.infer<typeof RenameFileSchema>;

export type MoveFileBody = z.infer<typeof MoveFileSchema>;
