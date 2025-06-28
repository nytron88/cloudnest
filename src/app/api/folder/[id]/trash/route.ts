import {
  ContextWithId,
  withLoggerAndErrorHandler,
} from "@/lib/api/withLoggerAndErrorHandler";
import { errorResponse, successResponse } from "@/lib/utils/responseWrapper";
import { requireAuth } from "@/lib/api/requireAuth";
import { NextResponse } from "next/server";
import { FolderIdParamsSchema } from "@/schemas/folderIdParamsSchema";
import prisma from "@/lib/prisma/prisma";
import { slugify } from "@/lib/utils/slugify";

async function getUniqueFolderNameInTrash(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  originalFolderName: string,
  userId: string,
  excludeFolderId?: string
): Promise<{ name: string; path: string }> {
  let baseNameForCollision = originalFolderName;
  let slugifiedBaseForPath = slugify(originalFolderName, "_");

  let counter = 0;
  let uniqueFound = false;

  const trashPathPrefix = "/trash/";

  while (!uniqueFound) {
    const currentPath = trashPathPrefix + slugifiedBaseForPath;

    const existingFolder = await tx.folder.findFirst({
      where: {
        userId,
        path: currentPath,
        isTrash: true,
        parentId: null,
        id: excludeFolderId ? { not: excludeFolderId } : undefined,
      },
    });

    if (!existingFolder) {
      uniqueFound = true;
    } else {
      counter++;
      baseNameForCollision = `${originalFolderName} (${counter})`;
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
            name: true,
            path: true,
          },
        });

        if (!folder) {
          return errorResponse("Folder not found", 404);
        }

        if (folder.userId !== userId) {
          return errorResponse("Unauthorized", 403);
        }

        if (folder.isTrash) {
          return successResponse("Folder is already in trash", 200);
        }

        const { name: uniqueNameInTrash, path: uniquePathInTrash } =
          await getUniqueFolderNameInTrash(tx, folder.name, userId, folderId);

        await tx.folder.update({
          where: { id: folderId },
          data: {
            isTrash: true,
            name: uniqueNameInTrash,
            path: uniquePathInTrash,
          },
        });

        return successResponse("Folder moved to trash successfully", 200);
      });

      return result;
    } catch (error: any) {
      return errorResponse(
        "Failed to move folder to trash",
        500,
        error.message
      );
    }
  }
);
