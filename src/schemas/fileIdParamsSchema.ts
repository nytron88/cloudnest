import { z } from "zod";

export const FileIdParamsSchema = z.object({
  params: z.object({
    id: z
      .string()
      .min(1, "ID is required")
      .regex(/^c[a-z0-9]{24}$/, "Invalid CUID format"),
  }),
});
