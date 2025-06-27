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
import { Folder } from "@/types/folder";

async function getUniqueFolderName(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  baseName: string,
  parentId: string | null,
  userId: string
): Promise<{ name: string; path: string }> {
  let newName = baseName;
  let newPathSegment = slugify(baseName, "_");

  let counter = 0;
  let uniqueFound = false;

  let basePathPrefix = "";
  if (parentId) {
    const parent = await tx.folder.findUnique({
      where: { id: parentId },
      select: { path: true },
    });
    if (parent) {
      basePathPrefix = parent.path + "/";
    }
  } else {
    basePathPrefix = "/";
  }

  while (!uniqueFound) {
    let currentPath = basePathPrefix + newPathSegment;

    const existingFolder = await tx.folder.findFirst({
      where: {
        userId,
        parentId: parentId,
        path: currentPath,
        isTrash: false,
      },
    });

    if (!existingFolder) {
      uniqueFound = true;
    } else {
      counter++;
      newName = `${baseName} (${counter})`;
      newPathSegment = slugify(newName, "_");
    }
  }
  return { name: newName, path: basePathPrefix + newPathSegment };
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
            parentId: true,
            path: true,
            name: true,
          },
        });

        if (!folder) {
          return errorResponse("Folder not found", 404);
        }

        if (folder.userId !== userId) {
          return errorResponse("Unauthorized", 403);
        }

        if (!folder.isTrash) {
          return successResponse("Folder is not in trash", 200);
        }

        let finalName = folder.name;
        let finalPath = folder.path;

        const targetParentId = folder.parentId;

        const { name: uniqueName, path: uniquePath } =
          await getUniqueFolderName(tx, folder.name, targetParentId, userId);

        finalName = uniqueName;
        finalPath = uniquePath;

        const updatedFolder = await tx.folder.update({
          where: { id: folderId },
          data: {
            isTrash: false,
            name: finalName,
            path: finalPath,
          },
        });

        return successResponse<Folder>(
          "Folder restored successfully",
          200,
          updatedFolder
        );
      });

      return result;
    } catch (error: any) {
      return errorResponse("Failed to restore folder", 500, error.message);
    }
  }
);
