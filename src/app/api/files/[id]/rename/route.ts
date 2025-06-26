import { withLoggerAndErrorHandler } from "@/lib/api/withLoggerAndErrorHandler";
import { successResponse, errorResponse } from "@/lib/utils/responseWrapper";
import prisma from "@/lib/prisma/prisma";
import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api/requireAuth";
import { ContextWithId } from "@/lib/api/withLoggerAndErrorHandler";
import { FileIdParamsSchema } from "@/schemas/fileIdParamsSchema";
import { RenameFileSchema } from "@/schemas/renameFileSchema";
import { slugify } from "@/lib/utils/slugify";

export const PATCH = withLoggerAndErrorHandler(
  async (request, props: ContextWithId) => {
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;

    const { userId } = auth;

    const parseParams = FileIdParamsSchema.safeParse(props);
    if (!parseParams.success) {
      return errorResponse("Invalid file ID", 400, parseParams.error.flatten());
    }

    const { id: fileId } = parseParams.data.params;

    let newName: string;

    try {
      const json = await request.json();
      const parseBody = RenameFileSchema.safeParse(json);
      if (!parseBody.success) {
        return errorResponse(
          "Invalid file name",
          400,
          parseBody.error.flatten()
        );
      }
      newName = parseBody.data.name;
    } catch {
      return errorResponse("Invalid JSON body", 400);
    }

    try {
      const file = await prisma.file.findUnique({
        where: { id: fileId },
        select: {
          userId: true,
          isTrash: true,
          folderId: true,
          path: true,
          name: true,
        },
      });

      if (!file) return errorResponse("File not found", 404);

      if (file.name === newName)
        return successResponse("File already has this name", 200);

      if (file.userId !== userId) return errorResponse("Unauthorized", 403);

      if (file.isTrash) {
        return errorResponse(
          "File is in trash. Please restore the file first.",
          400
        );
      }

      const lastSlashIndex = file.path.lastIndexOf("/");

      const pathSafeName = slugify(newName, "_");

      const newPath =
        lastSlashIndex !== -1
          ? file.path.slice(0, lastSlashIndex + 1) + pathSafeName
          : pathSafeName;

      const existingFile = await prisma.file.findFirst({
        where: {
          path: newPath,
          userId,
          id: { not: fileId },
        },
        select: { id: true },
      });

      if (existingFile) {
        return errorResponse(
          "A file with this name already exists in the folder",
          400
        );
      }

      await prisma.file.update({
        where: { id: fileId },
        data: { name: newName, path: newPath },
      });

      return successResponse("File renamed successfully", 200);
    } catch (error: any) {
      return errorResponse("Failed to rename file", 500, error.message);
    }
  }
);
