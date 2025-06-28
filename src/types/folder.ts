import { z } from "zod";
import { FolderInputSchema } from "@/schemas/createFolderSchema";
import { Folder as PrismaFolder } from "@prisma/client";
import { FolderSearchSchema } from "@/schemas/folderSearchSchema";
import { FolderIdParamsSchema } from "@/schemas/folderIdParamsSchema";
import { RenameFolderSchema } from "@/schemas/renameFolderSchema";
import { MoveFolderSchema } from "@/schemas/moveFolderSchema";

export type Folder = PrismaFolder;

export type FolderInput = z.infer<typeof FolderInputSchema>;
export type FolderInputBody = z.infer<typeof FolderInputSchema>;

export type FolderSearchParams = z.infer<typeof FolderSearchSchema>;

export type FolderIdParams = z.infer<typeof FolderIdParamsSchema>;

export type RenameFolderBody = z.infer<typeof RenameFolderSchema>;

export type MoveFolderBody = z.infer<typeof MoveFolderSchema>;
