import { z } from "zod";
import { FolderInputSchema } from "@/schemas/createFolderSchema";
import { Folder as PrismaFolder } from "@prisma/client";
import { FolderSearchSchema } from "@/schemas/folderSearchSchema";
import { FolderIdParamsSchema } from "@/schemas/folderIdParamsSchema";

export type Folder = PrismaFolder;

export type FolderInput = z.infer<typeof FolderInputSchema>;
export type FolderInputBody = z.infer<typeof FolderInputSchema>;

export type FolderSearchParams = z.infer<typeof FolderSearchSchema>;

export type FolderIdParams = z.infer<typeof FolderIdParamsSchema>;
