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
      const result = await prisma.$transaction(async (tx) => {
        const file = await tx.file.findUnique({
          where: {
            id: fileId,
          },
          select: {
            userId: true,
            isStarred: true,
            isTrash: true,
          },
        });

        if (!file) {
          return errorResponse("File not found", 404);
        }

        if (file.userId !== userId) {
          return errorResponse("Unauthorized", 403);
        }

        if (file.isTrash) {
          return errorResponse(
            "File is in trash and cannot be starred/unstarred. Please restore it first.",
            400
          );
        }

        await tx.file.update({
          where: {
            id: fileId,
          },
          data: {
            isStarred: !file.isStarred,
          },
        });

        const message = `File ${
          file.isStarred ? "unstarred" : "starred"
        } successfully`;

        return successResponse(message, 200);
      });

      return result;
    } catch (error: any) {
      return errorResponse(
        "Failed to update starred status of the file",
        500,
        error.message
      );
    }
  }
);
