import { withLoggerAndErrorHandler } from "@/lib/api/withLoggerAndErrorHandler";
import { successResponse, errorResponse } from "@/lib/utils/responseWrapper";
import { requireAuth } from "@/lib/api/requireAuth";
import prisma from "@/lib/prisma/prisma";
import { NextResponse, type NextRequest } from "next/server";
import { Folder } from "@/types/folder";
import { FolderInputSchema } from "@/schemas/createFolderSchema";
import type { CombinedContentItem, FolderInputBody } from "@/types/folder";
import { slugify } from "@/lib/utils/slugify";
import { UserContentSearchSchema } from "@/schemas/userContentSearchSchema";
import { PaginatedResponse } from "@/types/pagination";
import { Prisma } from "@prisma/client";

export const GET = withLoggerAndErrorHandler(async (request: NextRequest) => {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  const { userId } = auth;

  const rawQuery = Object.fromEntries(request.nextUrl.searchParams.entries());
  const parseResult = UserContentSearchSchema.safeParse(rawQuery);

  if (!parseResult.success) {
    return errorResponse("Invalid search parameters", 400, parseResult.error);
  }

  const {
    folderId,
    search,
    page,
    pageSize,
    sortBy,
    order,
    isTrash,
    isStarred,
  } = parseResult.data;

  const currentPage = page ?? 1;
  const itemsPerPage = pageSize ?? 10;

  try {
    const commonFilters = {
      userId,
      isTrash: typeof isTrash === "boolean" ? isTrash : undefined,
      isStarred: typeof isStarred === "boolean" ? isStarred : undefined,
      name: search
        ? { contains: search, mode: "insensitive" as Prisma.QueryMode }
        : undefined,
    };

    const folderWhere: Prisma.FolderWhereInput = {
      ...commonFilters,
      parentId: folderId ?? null,
    };

    const fileWhere: Prisma.FileWhereInput = {
      ...commonFilters,
      folderId: folderId ?? null,
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
            userId: true,
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
            size: true,
            type: true,
            fileUrl: true,
            folderId: true,
            isTrash: true,
            isStarred: true,
            createdAt: true,
            updatedAt: true,
            imagekitFileId: true,
            userId: true,
          },
          orderBy: { [sortBy ?? "name"]: order ?? "asc" },
          take: itemsPerPage / 2,
          skip: (currentPage - 1) * itemsPerPage,
        }),
        prisma.folder.count({ where: folderWhere }),
        prisma.file.count({ where: fileWhere }),
      ]);

    const combinedItems: CombinedContentItem[] = [
      ...folders.map((f) => ({
        ...f,
        type: "folder" as const,
      })),
      ...files.map((f) => {
        const { type: originalFileType, ...rest } = f;
        return {
          ...rest,
          type: "file" as const,
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
    }

    const totalItems = totalFoldersCount + totalFilesCount;
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    return successResponse<PaginatedResponse<CombinedContentItem>>(
      "Content retrieved successfully",
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
    return errorResponse("Failed to retrieve user content", 500, error.message);
  }
});

export const POST = withLoggerAndErrorHandler(async (request: NextRequest) => {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  const { userId } = auth;

  let parsedBody: FolderInputBody;

  try {
    const json = await request.json();
    const result = FolderInputSchema.safeParse(json);

    if (!result.success) {
      return errorResponse("Invalid request body", 400, result.error.flatten());
    }

    parsedBody = result.data;
  } catch {
    return errorResponse("Invalid JSON body", 400);
  }

  const { name, parentId } = parsedBody;

  try {
    const result = await prisma.$transaction(async (tx) => {
      let path: string;

      if (parentId) {
        const parentFolder = await tx.folder.findUnique({
          where: { id: parentId },
          select: { userId: true, isTrash: true, path: true },
        });

        if (!parentFolder) {
          return errorResponse("Parent folder not found", 404);
        }

        if (parentFolder.userId !== userId) {
          return errorResponse("Invalid parent folder ownership", 403);
        }

        if (parentFolder.isTrash) {
          return errorResponse("Cannot create folder in trash folder", 400);
        }

        path = `${parentFolder.path}/${slugify(name, "_")}`;
      } else {
        path = `/${slugify(name, "_")}`;
      }

      const existing = await tx.folder.findFirst({
        where: {
          userId,
          path,
        },
      });

      if (existing) {
        return errorResponse(
          "A folder with this name already exists here",
          409
        );
      }

      const newFolder = await tx.folder.create({
        data: {
          name,
          path,
          parentId: parentId ?? null,
          userId,
        },
      });

      return successResponse<Folder>(
        "Folder created successfully",
        201,
        newFolder
      );
    });

    return result;
  } catch (error: any) {
    return errorResponse("Failed to create folder", 500, error.message);
  }
});
