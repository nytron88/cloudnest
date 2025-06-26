import { z } from "zod";

export const FolderInputSchema = z.object({
  name: z.string().min(1, "Folder name is required"),
  parentId: z.string().nullable().default(null),
});
