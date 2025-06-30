import { z } from "zod";

export const AuthenticateShareLinkSchema = z.object({
  password: z.string().min(1, "Password is required."),
});
