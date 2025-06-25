import {
  ContextWithId,
  withLoggerAndErrorHandler,
} from "@/lib/api/withLoggerAndErrorHandler";
import { successResponse, errorResponse } from "@/lib/utils/responseWrapper";
import { requireAuth } from "@/lib/api/requireAuth";
import { NextResponse } from "next/server";
import { FileIdParamsSchema } from "@/schemas/fileIdParamsSchema";
import prisma from "@/lib/prisma/prisma";
import { MoveFileSchema } from "@/schemas/moveFileSchema";

export const PATCH = withLoggerAndErrorHandler(
  async (request, props: ContextWithId) => {
    const auth = await requireAuth();

    if (auth instanceof NextResponse) return auth;

    const { userId } = auth;

    const parseParams = FileIdParamsSchema.safeParse(props);

    if (!parseParams.success) {
      return errorResponse("Invalid file ID", 400, parseParams.error.flatten());
    }

    let folderId: string | null;

    try {
      const json = await request.json();
      const parseBody = MoveFileSchema.safeParse(json);
      if (!parseBody.success) {
        return errorResponse(
          "Invalid folder ID",
          400,
          parseBody.error.flatten()
        );
      }

      folderId = parseBody.data.folderId;
    } catch {
      return errorResponse("Invalid JSON body", 400);
    }

    const { id: fileId } = parseParams.data.params;

    try {
      const file = await prisma.file.findUnique({
        where: { id: fileId },
        select: {
          userId: true,
          isTrash: true,
          folderId: true,
          name: true,
          path: true,
        },
      });

      if (!file) return errorResponse("File not found", 404);
      if (file.userId !== userId) return errorResponse("Unauthorized", 403);
      if (file.isTrash) return errorResponse("File is in trash", 400);

      let newPath: string;

      if (folderId) {
        const folder = await prisma.folder.findUnique({
          where: { id: folderId },
          select: { userId: true, path: true },
        });

        if (!folder) return errorResponse("Folder not found", 404);
        if (folder.userId !== userId) return errorResponse("Unauthorized", 403);

        newPath = `${folder.path}/${file.name}`;
      } else {
        newPath = `/${file.name}`;
      }

      const existingFile = await prisma.file.findFirst({
        where: {
          path: newPath,
          userId,
          id: { not: fileId },
        },
        select: { id: true },
      });

      if (existingFile)
        return errorResponse(
          "A file with this name already exists in the folder. Please rename the file or move it to a different folder.",
          400
        );

      await prisma.file.update({
        where: { id: fileId },
        data: {
          folderId,
          path: newPath,
        },
      });

      return successResponse("File moved successfully");
    } catch (error: any) {
      return errorResponse("Failed to move file", 500, error.message);
    }
  }
);
