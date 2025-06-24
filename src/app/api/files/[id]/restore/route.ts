import {
  withLoggerAndErrorHandler,
  type ContextWithId,
} from "@/lib/api/withLoggerAndErrorHandler";
import { successResponse, errorResponse } from "@/lib/utils/responseWrapper";
import prisma from "@/lib/prisma/prisma";
import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api/requireAuth";
import { FileIdParamsSchema } from "@/schemas/fileIdParamsSchema";

export const PATCH = withLoggerAndErrorHandler(
  async (_, props: ContextWithId) => {
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
        where: {
          id: fileId,
        },
        select: {
          userId: true,
          isTrash: true,
        },
      });

      if (!file) {
        return errorResponse("File not found", 404);
      }

      if (file.userId !== userId) {
        return errorResponse("Unauthorized", 403);
      }

      if (!file.isTrash) {
        return errorResponse("File is not in trash", 400);
      }

      await prisma.file.update({
        where: { id: fileId },
        data: { isTrash: false },
      });

      return successResponse("File restored from trash successfully", 200);
    } catch (error: any) {
      return errorResponse(
        "Failed to restore file from trash",
        500,
        error.message
      );
    }
  }
);
