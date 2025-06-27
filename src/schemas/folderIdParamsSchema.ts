import { z } from "zod";

export const FolderIdParamsSchema = z.object({
  params: z.object({
    id: z.string().cuid(),
  }),
});
