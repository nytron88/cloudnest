import { z } from "zod";

export const FileIdParamsSchema = z.object({
  params: z.object({
    id: z.string().cuid("Invalid file ID"),
  }),
});
