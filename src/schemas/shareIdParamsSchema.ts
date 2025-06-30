import { z } from "zod";

export const ShareIdParamsSchema = z.object({
  params: z.object({
    id: z.string().cuid("Share ID is required."),
  }),
});
