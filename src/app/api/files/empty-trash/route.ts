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
        imagekitThumbnailId: true,
      },
    });

    if (trashedFiles.length === 0) {
      return successResponse("No trashed files found", 200);
    }

    const allFileIds = trashedFiles.flatMap((file) => [
      file.imagekitFileId,
      file.imagekitThumbnailId,
    ]);

    await safeBulkDeleteFiles(allFileIds, {
      method: "DELETE",
      url: request.url,
    });

    try {
      await prisma.file.deleteMany({
        where: {
          id: { in: trashedFiles.map((file) => file.id) },
        },
      });
    } catch (error: any) {
      return errorResponse(
        "Failed to delete trashed files",
        500,
        error.message
      );
    }

    return successResponse("Trashed files deleted successfully", 200);
  }
);
