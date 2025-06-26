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

export function mapFileType(fileType: string): FileType | null {
  const type = fileType.toLowerCase();

  if (type === "image") return "IMAGE";
  if (type === "video") return "VIDEO";
  if (type === "audio") return "AUDIO";
  if (type === "pdf") return "PDF";
  if (["doc", "docx", "ppt", "pptx", "xls", "xlsx", "txt"].includes(type)) {
    return "DOCUMENT";
  }

  return null;
}

export type FileIdParams = z.infer<typeof FileIdParamsSchema>;

export type RenameFileBody = z.infer<typeof RenameFileSchema>;

export type MoveFileBody = z.infer<typeof MoveFileSchema>;
