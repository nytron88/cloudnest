import { z } from "zod";

export const RecentContentSearchSchema = z.object({
  search: z.string().optional(),
  page: z.coerce.number().min(1).optional(),
  pageSize: z.coerce.number().min(1).max(100).optional(),
  sortBy: z
    .enum(["updatedAt", "createdAt", "name"])
    .default("updatedAt")
    .optional(),
  order: z.enum(["desc", "asc"]).default("desc").optional(),
});
