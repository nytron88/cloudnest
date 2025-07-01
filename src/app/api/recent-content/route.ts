import { withLoggerAndErrorHandler } from "@/lib/api/withLoggerAndErrorHandler";
import { successResponse, errorResponse } from "@/lib/utils/responseWrapper";
import { requireAuth } from "@/lib/api/requireAuth";
import prisma from "@/lib/prisma/prisma";
import { NextResponse, type NextRequest } from "next/server";
import { ApiFolderItem, ApiFileItem, CombinedContentItem } from "@/types/folder";
import { Prisma } from "@prisma/client";
import { RecentContentSearchSchema } from "@/schemas/recentContentSchema";
import { PaginatedResponse } from "@/types/pagination";

export const GET = withLoggerAndErrorHandler(async (request: NextRequest) => {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  const { userId } = auth;

  const rawQuery = Object.fromEntries(request.nextUrl.searchParams.entries());
  const parseResult = RecentContentSearchSchema.safeParse(rawQuery);

  if (!parseResult.success) {
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
    const commonFilters = {
      userId,
      isTrash: false,
      name: search
        ? { contains: search, mode: "insensitive" as Prisma.QueryMode }
        : undefined,
    };

    const folderWhere: Prisma.FolderWhereInput = {
      ...commonFilters,
    };

    const fileWhere: Prisma.FileWhereInput = {
      ...commonFilters,
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
    return errorResponse(
      "Failed to retrieve recent content",
      500,
      error.message
    );
  }
});
