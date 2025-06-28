import {
  ContextWithId,
  withLoggerAndErrorHandler,
} from "@/lib/api/withLoggerAndErrorHandler";
import { errorResponse, successResponse } from "@/lib/utils/responseWrapper";
import { MoveFolderBody } from "@/types/folder";
import { FolderIdParamsSchema } from "@/schemas/folderIdParamsSchema";
import { requireAuth } from "@/lib/api/requireAuth";
import { type NextRequest, NextResponse } from "next/server";
import { MoveFolderSchema } from "@/schemas/moveFolderSchema";
import prisma from "@/lib/prisma/prisma";
import { slugify } from "@/lib/utils/slugify";
import { Prisma } from "@prisma/client";

export const PATCH = withLoggerAndErrorHandler(
  async (request: NextRequest, props: ContextWithId) => {
    const auth = await requireAuth();

    if (auth instanceof NextResponse) return auth;

    const { userId } = auth;

    const parseResult = FolderIdParamsSchema.safeParse(props);

    if (!parseResult.success) {
      return errorResponse(
        "Invalid source folder ID",
        400,
        parseResult.error.flatten()
      );
    }

    const { id: sourceFolderId } = parseResult.data.params;

    let parsedBody: MoveFolderBody;

    try {
      const json = await request.json();
      const parseBody = MoveFolderSchema.safeParse(json);
      if (!parseBody.success) {
        return errorResponse(
          "Invalid target folder ID in body",
          400,
          parseBody.error.flatten()
        );
      }

      parsedBody = parseBody.data;
    } catch (err) {
      return errorResponse("Invalid JSON body", 400);
    }

    const { folderId: targetFolderId } = parsedBody;

    try {
      const result = await prisma.$transaction(async (tx) => {
        const sourceFolder = await tx.folder.findUnique({
          where: { id: sourceFolderId },
          select: {
            userId: true,
            isTrash: true,
            path: true,
            name: true,
            parentId: true,
          },
        });

        if (!sourceFolder) {
          return errorResponse("Source folder not found", 404);
        }
        if (sourceFolder.userId !== userId) {
          return errorResponse("Unauthorized: Source folder ownership", 403);
        }
        if (sourceFolder.isTrash) {
          return errorResponse("Cannot move folder that is in trash", 400);
        }

        const oldSourceRootPath = sourceFolder.path;
        const oldPrefixForDescendants =
          oldSourceRootPath === "/" ? "/" : `${oldSourceRootPath}/`;

        let newParentId: string | null;
        let targetFolderPath: string;

        if (targetFolderId) {
          if (targetFolderId === sourceFolderId) {
            return errorResponse("Cannot move folder to itself", 400);
          }

          const targetFolder = await tx.folder.findUnique({
            where: { id: targetFolderId },
            select: { userId: true, isTrash: true, path: true },
          });

          if (!targetFolder) {
            return errorResponse("Target folder not found", 404);
          }
          if (targetFolder.userId !== userId) {
            return errorResponse("Unauthorized: Target folder ownership", 403);
          }
          if (targetFolder.isTrash) {
            return errorResponse("Cannot move folder into a trash folder", 400);
          }

          if (targetFolder.path.startsWith(oldPrefixForDescendants)) {
            return errorResponse(
              "Cannot move folder into its own subfolder",
              400
            );
          }

          if (sourceFolder.parentId === targetFolderId) {
            return successResponse(
              "Folder is already in the target folder",
              200
            );
          }

          newParentId = targetFolderId;
          targetFolderPath = targetFolder.path;
        } else {
          if (sourceFolder.parentId === null) {
            return successResponse("Folder is already in the root folder", 200);
          }
          newParentId = null;
          targetFolderPath = "/";
        }

        const pathSafeSourceName = slugify(sourceFolder.name, "_");
        const newSourceFolderPath = `${targetFolderPath}${
          targetFolderPath === "/" ? "" : "/"
        }${pathSafeSourceName}`;

        const existingFolderInTarget = await tx.folder.findFirst({
          where: {
            userId,
            path: newSourceFolderPath,
            id: { not: sourceFolderId },
            isTrash: false,
          },
          select: { id: true },
        });

        if (existingFolderInTarget) {
          return errorResponse(
            "A folder with this name already exists in the target location. Please rename the folder or move it to a different location.",
            400
          );
        }

        const newPrefixForDescendants = `${newSourceFolderPath}/`;

        await tx.folder.update({
          where: { id: sourceFolderId },
          data: {
            parentId: newParentId,
            path: newSourceFolderPath,
          },
        });

        await tx.$executeRaw`
            UPDATE "Folder"
            SET path = REPLACE(path, ${oldPrefixForDescendants}, ${newPrefixForDescendants})
            WHERE "userId" = ${userId}
              AND path LIKE ${Prisma.raw(`${oldPrefixForDescendants}%`)}
              AND "isTrash" = FALSE;
          `;

        await tx.$executeRaw`
            UPDATE "File"
            SET path = REPLACE(path, ${oldPrefixForDescendants}, ${newPrefixForDescendants})
            WHERE "userId" = ${userId}
              AND path LIKE ${Prisma.raw(`${oldPrefixForDescendants}%`)}
              AND "isTrash" = FALSE;
          `;

        return successResponse("Folder moved successfully", 200);
      });

      return result;
    } catch (error: any) {
      return errorResponse("Failed to move folder", 500, error.message);
    }
  }
);
