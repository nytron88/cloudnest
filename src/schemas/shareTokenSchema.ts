import { z } from "zod";

export const ShareTokenParamsSchema = z.object({
  params: z.object({
    id: z.string().length(32, "Share token must be 32 characters long."),
  }),
});
