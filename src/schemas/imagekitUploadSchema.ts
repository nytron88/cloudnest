import { z } from "zod";
import { FileType } from "@/types/file";

export const ImageKitPayloadSchema = z.object({
  name: z.string().default("Untitled"),
  size: z.number().nonnegative().default(0),
  fileType: z.nativeEnum(FileType),
  fileUrl: z.string().url().default(""),
  imagekitFileId: z.string().default(""),
  folderId: z.string().nullable().default(null),
});

export const FileUploadSchema = z.object({
  imagekit: ImageKitPayloadSchema,
  userId: z.string(),
});
