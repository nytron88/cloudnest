import { z } from "zod";

export const ShareTokenParamsSchema = z.object({
  params: z.object({
    token: z.string().nanoid("Invalid share token"),
  }),
});
