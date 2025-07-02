import { withLoggerAndErrorHandler } from "@/lib/api/withLoggerAndErrorHandler";
import { successResponse, errorResponse } from "@/lib/utils/responseWrapper";
import { requireAuth } from "@/lib/api/requireAuth";
import prisma from "@/lib/prisma/prisma";
import { NextResponse, type NextRequest } from "next/server";
import {
  ApiFolderItem,
  ApiFileItem,
  CombinedContentItem,
} from "@/types/folder";
import { PaginatedResponse } from "@/types/pagination";
import { Prisma } from "@prisma/client";
import { RecentContentSearchSchema } from "@/schemas/recentContentSchema";

export const GET = withLoggerAndErrorHandler(async (request: NextRequest) => {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  const { userId } = auth;

  const rawQuery = Object.fromEntries(request.nextUrl.searchParams.entries());
  const parseResult = RecentContentSearchSchema.safeParse(rawQuery);

  if (!parseResult.success) {
    console.error(
      "GET /api/user/recent-content: Invalid search params",
      parseResult.error.flatten()
    );
    return errorResponse(
      "Invalid search parameters",
      400,
      parseResult.error.flatten()
    );
  }

  const { search, page, pageSize, sortBy, order } = parseResult.data;

  const currentPage = page ?? 1;
  const itemsPerPage = pageSize ?? 10;

  try {
    // --- Determine a list of all trashed folder paths ---
    // We need this to filter out files/folders that are *implicitly* in trash.
    const trashedFolderPaths = await prisma.folder.findMany({
      where: {
        userId,
        isTrash: true, // Find all folders marked as trashed
      },
      select: { path: true }, // Select their paths
    });

    const trashedPaths = trashedFolderPaths.map((f) => f.path);

    // Build array of NOT LIKE conditions for the paths
    const notInTrashedFolderConditions =
      trashedPaths.length > 0
        ? trashedPaths.map((p) => ({
            path: { not: { startsWith: `${p}/` } }, // Path must not start with trashed folder path + slash
          }))
        : [];

    // --- End trashed folder path collection ---

    const commonFilters = {
      userId,
      isTrash: false, // Ensure item itself is not explicitly in trash
      name: search
        ? { contains: search, mode: "insensitive" as Prisma.QueryMode }
        : undefined,
    };

    const folderWhere: Prisma.FolderWhereInput = {
      ...commonFilters,
      // Additionally, ensure this folder is not a descendant of a trashed folder
      // (itself or any parent).
      AND:
        notInTrashedFolderConditions.length > 0
          ? notInTrashedFolderConditions
          : undefined,
    };

    const fileWhere: Prisma.FileWhereInput = {
      ...commonFilters,
      // Additionally, ensure this file is not a descendant of a trashed folder.
      // We can check its own path (if it's a root file in trashed hierarchy),
      // or check its parent folder's path.
      AND:
        notInTrashedFolderConditions.length > 0
          ? notInTrashedFolderConditions
          : undefined,
      // Alternatively (or additionally for files), check if its direct folder is trashed:
      // folder: { isTrash: false } // This would ensure direct parent isn't trashed.
      // The `path: { not: { startsWith: ... } }` is more comprehensive.
    };

    const [folders, files, totalFoldersCount, totalFilesCount] =
      await Promise.all([
        prisma.folder.findMany({
          where: folderWhere,
          select: {
            id: true,
            name: true,
            path: true,
            parentId: true,
            isTrash: true,
            isStarred: true,
            createdAt: true,
            updatedAt: true,
          },
          orderBy: { [sortBy ?? "updatedAt"]: order ?? "desc" },
          skip: (currentPage - 1) * (itemsPerPage / 2),
          take: itemsPerPage / 2,
        }),
        prisma.file.findMany({
          where: fileWhere,
          select: {
            id: true,
            name: true,
            path: true,
            size: true,
            type: true,
            fileUrl: true,
            folderId: true,
            isTrash: true,
            isStarred: true,
            createdAt: true,
            updatedAt: true,
            imagekitFileId: true,
          },
          orderBy: { [sortBy ?? "updatedAt"]: order ?? "desc" },
          take: itemsPerPage / 2,
          skip: (currentPage - 1) * (itemsPerPage / 2),
        }),
        prisma.folder.count({ where: folderWhere }),
        prisma.file.count({ where: fileWhere }),
      ]);

    const combinedItems: CombinedContentItem[] = [
      ...folders.map(
        (f): ApiFolderItem => ({
          id: f.id,
          name: f.name,
          path: f.path,
          parentId: f.parentId,
          isTrash: f.isTrash,
          isStarred: f.isStarred,
          createdAt: f.createdAt,
          updatedAt: f.updatedAt,
          type: "folder",
        })
      ),
      ...files.map((f): ApiFileItem => {
        const { type: originalFileType, ...rest } = f;
        return {
          ...rest,
          type: "file",
          fileType: originalFileType,
        };
      }),
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
    } else {
      combinedItems.sort((a, b) => {
        const dateA = new Date(a[sortBy ?? "updatedAt"]).getTime();
        const dateB = new Date(b[sortBy ?? "updatedAt"]).getTime();
        if (order === "asc") {
          return dateA - dateB;
        } else {
          return dateB - dateA;
        }
      });
    }

    const totalItems = totalFoldersCount + totalFilesCount;
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    return successResponse<PaginatedResponse<CombinedContentItem>>(
      "Recent content retrieved successfully",
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
    console.error(
      "GET /api/user/recent-content: Failed to retrieve recent content.",
      error
    );
    return errorResponse(
      "Failed to retrieve recent content",
      500,
      error.message
    );
  }
});
