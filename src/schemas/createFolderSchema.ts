import { z } from "zod";

export const FolderInputSchema = z.object({
  name: z.string().min(1, "Folder name is required"),
  userId: z.string(),
  parentId: z.string().nullable().default(null),
  isTrash: z.boolean().default(false),
  isStarred: z.boolean().default(false),
});

export const FolderInputBodySchema = z.object({
  folder: FolderInputSchema,
  userId: z.string(),
});
