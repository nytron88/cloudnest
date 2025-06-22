import { z } from "zod";
import {
  FolderInputSchema,
  FolderInputBodySchema,
} from "@/schemas/createFolderSchema";
import { Folder as PrismaFolder } from "@prisma/client";

export type Folder = PrismaFolder;

export type FolderInput = z.infer<typeof FolderInputSchema>;
export type FolderInputBody = z.infer<typeof FolderInputBodySchema>;
