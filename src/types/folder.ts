import { z } from "zod";
import { FolderInputSchema } from "@/schemas/createFolderSchema";
import { Folder as PrismaFolder } from "@prisma/client";
import { FolderSearchSchema } from "@/schemas/folderSearchSchema";

export type Folder = PrismaFolder;

export type FolderInput = z.infer<typeof FolderInputSchema>;
export type FolderInputBody = z.infer<typeof FolderInputSchema>;

export type FolderSearchParams = z.infer<typeof FolderSearchSchema>;
