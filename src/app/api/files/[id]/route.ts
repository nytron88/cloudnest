import {
  withLoggerAndErrorHandler,
  type ContextWithId,
} from "@/lib/api/withLoggerAndErrorHandler";
import { requireAuth } from "@/lib/api/requireAuth";
import { type NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma/prisma";
import { successResponse, errorResponse } from "@/lib/utils/responseWrapper";
import { FileIdParamsSchema } from "@/schemas/fileIdParamsSchema";
import { safeDeleteFile } from "@/lib/imagekit/safeDeleteFile";

export const DELETE = withLoggerAndErrorHandler(
  async (request: NextRequest, props: ContextWithId) => {
    const auth = await requireAuth();
    if (auth instanceof NextResponse) return auth;

    const { userId } = auth;

    const parseResult = FileIdParamsSchema.safeParse(props);

    if (!parseResult.success) {
      return errorResponse("Invalid file ID", 400, parseResult.error.flatten());
    }

    const { id: fileId } = parseResult.data.params;

    try {
      const file = await prisma.file.findUnique({
        where: { id: fileId },
        select: {
          userId: true,
          isTrash: true,
          imagekitFileId: true,
          thumbnailUrl: true,
        },
      });

      if (!file) return errorResponse("File not found", 404);

      if (file.userId !== userId) return errorResponse("Unauthorized", 403);

      await safeDeleteFile(file.imagekitFileId, {
        method: "DELETE",
        url: request.url,
      });
      if (file.thumbnailUrl)
        await safeDeleteFile(file.thumbnailUrl, {
          method: "DELETE",
          url: request.url,
        });

      await prisma.file.delete({
        where: { id: fileId },
      });

      return successResponse("File deleted successfully", 204);
    } catch (error: any) {
      return errorResponse("Failed to delete file", 500, error.message);
    }
  }
);
