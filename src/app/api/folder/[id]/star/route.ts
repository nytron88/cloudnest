import {
  ContextWithId,
  withLoggerAndErrorHandler,
} from "@/lib/api/withLoggerAndErrorHandler";
import { errorResponse, successResponse } from "@/lib/utils/responseWrapper";
import { requireAuth } from "@/lib/api/requireAuth";
import { NextResponse } from "next/server";
import { FolderIdParamsSchema } from "@/schemas/folderIdParamsSchema";
import prisma from "@/lib/prisma/prisma";

export const PATCH = withLoggerAndErrorHandler(
  async (_, props: ContextWithId) => {
    const auth = await requireAuth();

    if (auth instanceof NextResponse) return auth;

    const { userId } = auth;

    const parseResult = FolderIdParamsSchema.safeParse(props);

    if (!parseResult.success) {
      return errorResponse(
        "Invalid folder ID",
        400,
        parseResult.error.flatten()
      );
    }

    const { id: folderId } = parseResult.data.params;

    try {
      const result = await prisma.$transaction(async (tx) => {
        const folder = await tx.folder.findUnique({
          where: { id: folderId },
          select: {
            userId: true,
            isTrash: true,
            isStarred: true,
          },
        });

        if (!folder) {
          return errorResponse("Folder not found", 404);
        }

        if (folder.userId !== userId) {
          return errorResponse("Unauthorized", 403);
        }

        if (folder.isTrash) {
          return errorResponse("Folder is in trash", 400);
        }

        await tx.folder.update({
          where: { id: folderId },
          data: { isStarred: !folder.isStarred },
        });

        const message = `Folder ${
          folder.isStarred ? "unstarred" : "starred"
        } successfully`;

        return successResponse(message, 200);
      });

      return result;
    } catch (error: any) {
      return errorResponse("Failed to star folder", 500, error.message);
    }
  }
);
