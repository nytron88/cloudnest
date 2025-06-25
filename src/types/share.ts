import { z } from "zod";
import { CreateShareLinkSchema } from "@/schemas/createSharedLinkSchema";

export type CreateShareLinkResponse = {
  token: string;
  url: string;
};

export type CreateShareLinkBody = z.infer<typeof CreateShareLinkSchema>;
