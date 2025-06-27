import { withLoggerAndErrorHandler } from "@/lib/api/withLoggerAndErrorHandler";
import { errorResponse, successResponse } from "@/lib/utils/responseWrapper";
import { requireAuth } from "@/lib/api/requireAuth";
import { type NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma/prisma";
import { safeBulkDeleteFiles } from "@/lib/imagekit/safeBulkDeleteFiles";

export const DELETE = withLoggerAndErrorHandler(
  async (request: NextRequest) => {
    const auth = await requireAuth();

    if (auth instanceof NextResponse) return auth;

    const { userId } = auth;

    const trashedFiles = await prisma.file.findMany({
      where: {
        userId,
        isTrash: true,
      },
      select: {
        id: true,
        imagekitFileId: true,
        size: true,
      },
    });

    if (trashedFiles.length === 0) {
      return successResponse("No trashed files found to empty", 200);
    }

    const imagekitFileIds = trashedFiles.map((file) => file.imagekitFileId);
    const fileIdsToDelete = trashedFiles.map((file) => file.id);
    const totalBytesFreed = trashedFiles.reduce(
      (sum, file) => sum + file.size,
      0
    );

    try {
      const response = await prisma.$transaction(async (tx) => {
        if (imagekitFileIds.length > 0) {
          await safeBulkDeleteFiles(imagekitFileIds, {
            method: "DELETE",
            url: request.url,
          });
        }

        if (fileIdsToDelete.length > 0) {
          await tx.file.deleteMany({
            where: {
              id: { in: fileIdsToDelete },
            },
          });
        }

        await tx.user.update({
          where: { id: userId },
          data: { usedStorage: { decrement: totalBytesFreed } },
        });

        return successResponse("Trashed files deleted successfully", 200);
      });

      return response;
    } catch (error: any) {
      return errorResponse(
        "Failed to delete trashed files",
        500,
        error.message
      );
    }
  }
);
