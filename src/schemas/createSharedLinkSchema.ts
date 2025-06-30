import { z } from "zod";

export const CreateShareLinkSchema = z.object({
  password: z.string().min(1).max(100).optional(),
  expiresAt: z.string().datetime({ message: "Invalid datetime format" }),
});
