import { z } from "zod";
import { FolderInputSchema } from "@/schemas/createFolderSchema";
import { Folder as PrismaFolder, Prisma } from "@prisma/client";
import { UserContentSearchSchema } from "@/schemas/userContentSearchSchema";
import { FolderIdParamsSchema } from "@/schemas/folderIdParamsSchema";
import { RenameFolderSchema } from "@/schemas/renameFolderSchema";
import { MoveFolderSchema } from "@/schemas/moveFolderSchema";
import { File, FileType } from "@/types/file";

export type Folder = PrismaFolder;

export type FolderInput = z.infer<typeof FolderInputSchema>;
export type FolderInputBody = z.infer<typeof FolderInputSchema>;

export type FolderSearchParams = z.infer<typeof UserContentSearchSchema>;

export type FolderIdParams = z.infer<typeof FolderIdParamsSchema>;

export type RenameFolderBody = z.infer<typeof RenameFolderSchema>;

export type MoveFolderBody = z.infer<typeof MoveFolderSchema>;

export type SelectedFolderPayload = Prisma.FolderGetPayload<{
  select: {
    id: true;
    name: true;
    path: true;
    parentId: true;
    isTrash: true;
    isStarred: true;
    createdAt: true;
    updatedAt: true;
  };
}>;

export type SelectedFilePayload = Prisma.FileGetPayload<{
  select: {
    id: true;
    name: true;
    path: true;
    size: true;
    type: true;
    fileUrl: true;
    folderId: true;
    isTrash: true;
    isStarred: true;
    createdAt: true;
    updatedAt: true;
    imagekitFileId: true;
  };
}>;

export interface ApiFolderItem extends SelectedFolderPayload {
  type: "folder";
  fileType?: never;
}

export interface ApiFileItem extends Omit<SelectedFilePayload, "type"> {
  type: "file";
  fileType: FileType;
}

export type CombinedContentItem = ApiFolderItem | ApiFileItem;
