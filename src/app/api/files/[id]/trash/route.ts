import {
  withLoggerAndErrorHandler,
  type ContextWithId,
} from "@/lib/api/withLoggerAndErrorHandler";
import { requireAuth } from "@/lib/api/requireAuth";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma/prisma";
import { successResponse, errorResponse } from "@/lib/utils/responseWrapper";
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
        where: { id: fileId },
        select: { userId: true, isTrash: true },
      });

      if (!file) return errorResponse("File not found", 404);

      if (file.userId !== userId) return errorResponse("Unauthorized", 403);

      if (file.isTrash) return successResponse("File already in trash", 200);

      await prisma.file.update({
        where: { id: fileId },
        data: { isTrash: true },
      });

      return successResponse("File moved to trash", 200);
    } catch (error: any) {
      return errorResponse("Failed to fetch file", 500, error.message);
    }
  }
);
