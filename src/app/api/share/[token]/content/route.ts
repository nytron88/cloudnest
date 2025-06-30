import {
  withLoggerAndErrorHandler,
  ContextWithId,
} from "@/lib/api/withLoggerAndErrorHandler";
import { errorResponse, successResponse } from "@/lib/utils/responseWrapper";
import { type NextRequest } from "next/server";
import prisma from "@/lib/prisma/prisma";
import { cookies } from "next/headers";
import {
  verifyShareAuthJwt,
  getShareAuthCookieName,
} from "@/lib/utils/shareAuthJwt";
import { Prisma } from "@prisma/client";
import { ShareTokenParamsSchema } from "@/schemas/shareTokenSchema";
import { FolderContentsQuerySchema } from "@/schemas/folderContentQuerySchema";
import { SharedContentItem } from "@/types/share";
import { PaginatedResponse } from "@/types/pagination";

export const GET = withLoggerAndErrorHandler(
  async (request: NextRequest, props: ContextWithId) => {
    const parseTokenResult = ShareTokenParamsSchema.safeParse(props);
    if (!parseTokenResult.success) {
      return errorResponse(
        "Invalid share token format",
        400,
        parseTokenResult.error.flatten()
      );
    }
    const { token } = parseTokenResult.data.params;

    const rawQuery = Object.fromEntries(request.nextUrl.searchParams.entries());
    const parseQueryParams = FolderContentsQuerySchema.safeParse(rawQuery);
    if (!parseQueryParams.success) {
      return errorResponse(
        "Invalid query parameters",
        400,
        parseQueryParams.error.flatten()
      );
    }
    const { currentFolderId, search, page, pageSize, sortBy, order } =
      parseQueryParams.data;

    const currentPage = page ?? 1;
    const itemsPerPage = pageSize ?? 10;

    try {
      const sharedLink = await prisma.sharedLink.findUnique({
        where: { token },
        select: {
          userId: true,
          folderId: true,
          expiresAt: true,
          password: true,
        },
      });

      if (!sharedLink) {
        return errorResponse("Shared link not found", 404);
      }

      if (sharedLink.expiresAt && sharedLink.expiresAt < new Date()) {
        return errorResponse("Shared link has expired", 401);
      }

      if (sharedLink.password) {
        const authCookieName = getShareAuthCookieName(token);
        const authCookie = (await cookies()).get(authCookieName);

        let isAuthenticatedByCookie = false;
        if (authCookie) {
          isAuthenticatedByCookie = !!verifyShareAuthJwt(
            authCookie.value,
            token
          );
        }

        if (!isAuthenticatedByCookie) {
          return errorResponse("Password required for this shared link", 401);
        }
      }

      if (!sharedLink.folderId) {
        return errorResponse(
          "This shared link is for a file, not a folder",
          400
        );
      }

      let actualTargetFolderId = sharedLink.folderId;

      const originalSharedFolder = await prisma.folder.findUnique({
        where: { id: sharedLink.folderId },
        select: { id: true, userId: true, path: true, isTrash: true },
      });

      if (!originalSharedFolder) {
        return errorResponse(
          "Shared link points to a non-existent folder. Please contact support.",
          500
        );
      }
      if (originalSharedFolder.isTrash) {
        return errorResponse(
          "Shared content is in trash and cannot be accessed",
          403
        );
      }

      if (currentFolderId) {
        const requestedFolder = await prisma.folder.findUnique({
          where: { id: currentFolderId },
          select: { id: true, userId: true, path: true, isTrash: true },
        });

        if (!requestedFolder) {
          return errorResponse("Requested folder not found", 404);
        }
        if (requestedFolder.userId !== sharedLink.userId) {
          return errorResponse("Unauthorized: Folder ownership mismatch", 403);
        }
        if (
          requestedFolder.id !== originalSharedFolder.id &&
          !requestedFolder.path.startsWith(`${originalSharedFolder.path}/`)
        ) {
          return errorResponse(
            "Unauthorized: Folder not part of shared hierarchy",
            403
          );
        }
        if (requestedFolder.isTrash) {
          return errorResponse(
            "Shared folder is in trash and cannot be accessed",
            403
          );
        }
        actualTargetFolderId = currentFolderId;
      }

      const folderWhere: Prisma.FolderWhereInput = {
        userId: sharedLink.userId,
        isTrash: false,
        parentId: actualTargetFolderId,
        name: search
          ? { contains: search, mode: "insensitive" as Prisma.QueryMode }
          : undefined,
      };

      const fileWhere: Prisma.FileWhereInput = {
        userId: sharedLink.userId,
        isTrash: false,
        folderId: actualTargetFolderId,
        name: search
          ? { contains: search, mode: "insensitive" as Prisma.QueryMode }
          : undefined,
      };

      const [folders, files, totalFoldersCount, totalFilesCount] =
        await Promise.all([
          prisma.folder.findMany({
            where: folderWhere,
            select: {
              id: true,
              name: true,
              path: true,
              createdAt: true,
              updatedAt: true,
            },
            orderBy: { [sortBy ?? "name"]: order ?? "asc" },
            skip: (currentPage - 1) * itemsPerPage,
            take: itemsPerPage / 2,
          }),
          prisma.file.findMany({
            where: fileWhere,
            select: {
              id: true,
              name: true,
              path: true,
              type: true,
              size: true,
              fileUrl: true,
              createdAt: true,
              updatedAt: true,
            },
            orderBy: { [sortBy ?? "name"]: order ?? "asc" },
            skip: (currentPage - 1) * itemsPerPage,
            take: itemsPerPage / 2,
          }),
          prisma.folder.count({ where: folderWhere }),
          prisma.file.count({ where: fileWhere }),
        ]);

      const combinedItems: SharedContentItem[] = [
        ...folders.map((f) => ({
          ...f,
          type: "folder" as const,
        })),
        ...files.map((f) => ({
          ...f,
          type: "file" as const,
        })),
      ];

      if (sortBy === "name") {
        combinedItems.sort((a, b) => {
          const nameA = a.name.toLowerCase();
          const nameB = b.name.toLowerCase();
          if (order === "asc") {
            if (nameA < nameB) return -1;
            if (nameA > nameB) return 1;
          } else {
            if (nameA < nameB) return 1;
            if (nameA > nameB) return -1;
          }
          return 0;
        });
      }

      const totalItems = totalFoldersCount + totalFilesCount;
      const totalPages = Math.ceil(totalItems / itemsPerPage);

      return successResponse<PaginatedResponse<SharedContentItem>>(
        "Shared folder contents fetched successfully",
        200,
        {
          data: combinedItems,
          meta: {
            totalItems,
            currentPage,
            pageSize: itemsPerPage,
            totalPages,
          },
        }
      );
    } catch (error: any) {
      const errorMessage = error.message || "An unexpected error occurred.";
      return errorResponse(
        "Failed to fetch shared folder contents",
        500,
        errorMessage
      );
    }
  }
);
