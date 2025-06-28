import {
  withLoggerAndErrorHandler,
  ContextWithId,
} from "@/lib/api/withLoggerAndErrorHandler";
import { errorResponse, successResponse } from "@/lib/utils/responseWrapper";
import { requireAuth } from "@/lib/api/requireAuth";
import { FolderIdParamsSchema } from "@/schemas/folderIdParamsSchema";
import { type NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma/prisma";
import { safeBulkDeleteFiles } from "@/lib/imagekit/safeBulkDeleteFiles";

export const DELETE = withLoggerAndErrorHandler(
  async (request: NextRequest, props: ContextWithId) => {
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
        const folderToDelete = await tx.folder.findUnique({
          where: { id: folderId },
          select: { userId: true, path: true },
        });

        if (!folderToDelete) {
          return errorResponse("Folder not found", 404);
        }

        if (folderToDelete.userId !== userId) {
          return errorResponse("Unauthorized", 403);
        }

        const filesToPermanentlyDelete = await tx.file.findMany({
          where: {
            userId,
            OR: [
              { folderId: folderId },
              { folder: { path: { startsWith: `${folderToDelete.path}/` } } },
            ],
          },
          select: {
            id: true,
            imagekitFileId: true,
            size: true,
          },
        });

        const imagekitFileIds = filesToPermanentlyDelete.map(
          (f) => f.imagekitFileId
        );

        const totalBytesFreed = filesToPermanentlyDelete.reduce(
          (sum, f) => sum + f.size,
          0
        );

        if (imagekitFileIds.length > 0) {
          await safeBulkDeleteFiles(imagekitFileIds, {
            method: "DELETE",
            url: request.url,
          });
        }

        await tx.folder.delete({
          where: { id: folderId },
        });

        await tx.user.update({
          where: { id: userId },
          data: {
            usedStorage: {
              decrement: totalBytesFreed,
            },
          },
        });

        return successResponse(
          "Folder and its contents permanently deleted",
          200
        );
      });

      return result;
    } catch (error: any) {
      return errorResponse(
        "Failed to permanently delete folder",
        500,
        error.message
      );
    }
  }
);
