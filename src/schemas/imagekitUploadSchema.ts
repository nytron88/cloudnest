import { z } from "zod";
import { FileType } from "@/types/file";

export const ImageKitPayloadSchema = z
  .object({
    name: z.string().default("Untitled"),
    size: z.number().nonnegative().default(0),
    fileType: z.nativeEnum(FileType),
    fileUrl: z.string().url().default(""),
    thumbnailUrl: z.string().url().nullable().default(null),
    imagekitFileId: z.string().default(""),
    imagekitThumbnailId: z.string().nullable().default(null),
    folderId: z.string().nullable().default(null),
  })
  .refine(
    (data) =>
      (data.thumbnailUrl === null && data.imagekitThumbnailId === null) ||
      (data.thumbnailUrl !== null && data.imagekitThumbnailId !== null),
    {
      message:
        "Both thumbnailUrl and imagekitThumbnailId must be provided together or both be null.",
      path: ["thumbnailUrl"],
    }
  );

export const FileUploadSchema = z.object({
  imagekit: ImageKitPayloadSchema,
  userId: z.string(),
});
