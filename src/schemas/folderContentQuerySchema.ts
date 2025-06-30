import { z } from "zod";

export const FolderContentsQuerySchema = z.object({
  currentFolderId: z.string().cuid().optional(),
  search: z.string().optional(),
  page: z.coerce.number().min(1).optional(),
  pageSize: z.coerce.number().min(1).max(100).optional(),
  sortBy: z.enum(["name", "createdAt", "updatedAt"]).optional(),
  order: z.enum(["asc", "desc"]).optional(),
});
