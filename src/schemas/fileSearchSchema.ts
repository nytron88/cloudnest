import { z } from "zod";

export const FileSearchSchema = z.object({
  folderId: z.string().cuid().optional(),
  userId: z.string(),
  search: z.string().optional(),
  page: z.coerce.number().min(1).optional(),
  pageSize: z.coerce.number().min(1).max(100).optional(),
  sortBy: z.enum(["name", "createdAt", "updatedAt"]).optional(),
  order: z.enum(["asc", "desc"]).optional(),
  isTrash: z.preprocess((val) => val === "true", z.boolean()).optional(),
  isStarred: z.preprocess((val) => val === "true", z.boolean()).optional(),
});
