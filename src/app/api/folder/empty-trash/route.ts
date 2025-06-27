import { withLoggerAndErrorHandler } from "@/lib/api/withLoggerAndErrorHandler";
import { successResponse, errorResponse } from "@/lib/utils/responseWrapper";
import { requireAuth } from "@/lib/api/requireAuth";
import { safeBulkDeleteFiles } from "@/lib/imagekit/safeBulkDeleteFiles";
import prisma from "@/lib/prisma/prisma";
import { type NextRequest, NextResponse } from "next/server";

export const DELETE = withLoggerAndErrorHandler(
  async (request: NextRequest) => {
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;

    const { userId } = auth;

    try {
      const response = await prisma.$transaction(async (tx) => {
        const rootTrashedFolders = await tx.folder.findMany({
          where: {
            userId,
            isTrash: true,
            parentId: null,
          },
          select: { id: true },
        });

        if (rootTrashedFolders.length === 0) {
          return successResponse("No trashed folders found to empty", 200);
        }

        const rootTrashedFolderIds = rootTrashedFolders.map((f) => f.id);

        const filesToPermanentlyDelete = await tx.file.findMany({
          where: {
            userId,
            folder: {
              id: { in: rootTrashedFolderIds },
            },
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

        await tx.folder.deleteMany({
          where: {
            userId,
            isTrash: true,
            parentId: null,
          },
        });

        await tx.user.update({
          where: { id: userId },
          data: {
            usedStorage: {
              decrement: totalBytesFreed,
            },
          },
        });

        return successResponse("Emptied trashed folders successfully", 200);
      });

      return response;
    } catch (error: any) {
      return errorResponse(
        "Failed to empty trashed folders",
        500,
        error.message
      );
    }
  }
);
