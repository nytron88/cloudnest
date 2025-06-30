import { z } from "zod";

export const UpdateShareLinkSchema = z.object({
  password: z
    .string()
    .min(6, "Password must be at least 6 characters long")
    .optional()
    .nullable(),
  expiresAt: z
    .preprocess(
      (arg) => (arg === null || arg === "" ? null : new Date(arg as string)),
      z.date().nullable()
    )
    .optional(),
});
