import { File as PrismaFile, FileType as PrismaFileType } from "@prisma/client";

export type File = Omit<PrismaFile, "id" | "createdAt" | "updatedAt">;

export const FileType = PrismaFileType;
export type FileType = PrismaFileType;
