import {
  withLoggerAndErrorHandler,
  type ContextWithId,
} from "@/lib/api/withLoggerAndErrorHandler";
import { requireAuth } from "@/lib/api/requireAuth";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma/prisma";
import { successResponse, errorResponse } from "@/lib/utils/responseWrapper";
import { FileIdParamsSchema } from "@/schemas/fileIdParamsSchema";
import { slugify } from "@/lib/utils/slugify";

async function getUniqueFileNameInTrash(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  originalFullName: string,
  userId: string,
  excludeFileId?: string
): Promise<{ name: string; path: string }> {
  let baseNameForCollision = originalFullName;
  let slugifiedBaseForPath = slugify(originalFullName, "_");

  let counter = 0;
  let uniqueFound = false;

  const trashPathPrefix = "/trash/";

  while (!uniqueFound) {
    const currentPath = trashPathPrefix + slugifiedBaseForPath;

    const existingFile = await tx.file.findFirst({
      where: {
        userId,
        path: currentPath,
        isTrash: true,
        id: excludeFileId ? { not: excludeFileId } : undefined,
      },
    });

    if (!existingFile) {
      uniqueFound = true;
    } else {
      counter++;
      baseNameForCollision = `${originalFullName} (${counter})`;
      slugifiedBaseForPath = slugify(baseNameForCollision, "_");
    }
  }
  return {
    name: baseNameForCollision,
    path: trashPathPrefix + slugifiedBaseForPath,
  };
}

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
          where: { id: fileId },
          select: {
            userId: true,
            isTrash: true,
            name: true,
            path: true,
            folderId: true,
          },
        });

        if (!file) return errorResponse("File not found", 404);

        if (file.userId !== userId) return errorResponse("Unauthorized", 403);

        if (file.isTrash) return successResponse("File already in trash", 200);

        const { name: uniqueNameInTrash, path: uniquePathInTrash } =
          await getUniqueFileNameInTrash(tx, file.name, userId, fileId);

        await tx.file.update({
          where: { id: fileId },
          data: {
            isTrash: true,
            name: uniqueNameInTrash,
            path: uniquePathInTrash,
          },
        });

        return successResponse("File moved to trash", 200);
      });

      return result;
    } catch (error: any) {
      return errorResponse("Failed to move file to trash", 500, error.message);
    }
  }
);
