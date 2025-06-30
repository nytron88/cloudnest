import { z } from "zod";
import { CreateShareLinkSchema } from "@/schemas/createSharedLinkSchema";
import { SharedLink as SharedLinkType } from "@prisma/client";
import { AuthenticateShareLinkSchema } from "@/schemas/authenticateShareLinkSchema";
import { ShareTokenParamsSchema } from "@/schemas/shareTokenSchema";
import { ShareIdParamsSchema } from "@/schemas/shareIdParamsSchema";
import { UpdateShareLinkSchema } from "@/schemas/updateShareLinkSchema";
import { FolderContentsQuerySchema } from "@/schemas/folderContentQuerySchema";

export type SharedLink = SharedLinkType;

export type CreateShareLinkResponse = {
  token: string;
  url: string;
};

export type CreateShareLinkBody = z.infer<typeof CreateShareLinkSchema>;

export type ShareTokenParams = z.infer<typeof ShareTokenParamsSchema>;

export type ShareIdParams = z.infer<typeof ShareIdParamsSchema>;

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

export type UpdateShareLinkBody = z.infer<typeof UpdateShareLinkSchema>;

export type FolderContentsQueryParams = z.infer<
  typeof FolderContentsQuerySchema
>;

export type SharedFileContent = {
  id: string;
  name: string;
  path: string;
  type: "file";
  size: number;
  fileUrl: string;
  createdAt: Date;
  updatedAt: Date;
};

export type SharedFolderContent = {
  id: string;
  name: string;
  path: string;
  type: "folder";
  createdAt: Date;
  updatedAt: Date;
};

export type SharedContentItem = SharedFileContent | SharedFolderContent;
