import { z } from "zod";
import { CreateShareLinkSchema } from "@/schemas/createSharedLinkSchema";
import { SharedLink as SharedLinkType } from "@prisma/client";

export type SharedLink = SharedLinkType;

export type CreateShareLinkResponse = {
  token: string;
  url: string;
};

export type CreateShareLinkBody = z.infer<typeof CreateShareLinkSchema>;
