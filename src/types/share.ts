import { z } from "zod";
import { CreateShareLinkSchema } from "@/schemas/createSharedLinkSchema";
import { SharedLink as SharedLinkType } from "@prisma/client";
import { AuthenticateShareLinkSchema } from "@/schemas/authenticateShareLinkSchema";

export type SharedLink = SharedLinkType;

export type CreateShareLinkResponse = {
  token: string;
  url: string;
};

export type CreateShareLinkBody = z.infer<typeof CreateShareLinkSchema>;

export type AuthenticateShareLinkBody = z.infer<
  typeof AuthenticateShareLinkSchema
>;

export interface SharedFileMetadata {
  type: "file";
  id: string;
  name: string;
  path: string;
  fileUrl: string;
  size: number;
  hasPassword?: boolean;
  expiresAt?: Date | null;
}

export interface SharedFolderMetadata {
  type: "folder";
  id: string;
  name: string;
  path: string;
  hasPassword?: boolean;
  expiresAt?: Date | null;
}

export type SharedContentMetadata = SharedFileMetadata | SharedFolderMetadata;
