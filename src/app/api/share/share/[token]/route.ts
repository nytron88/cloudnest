import {
  withLoggerAndErrorHandler,
  ContextWithId,
} from "@/lib/api/withLoggerAndErrorHandler";
import { errorResponse, successResponse } from "@/lib/utils/responseWrapper";
import prisma from "@/lib/prisma/prisma";
import { cookies } from "next/headers";
import {
  verifyShareAuthJwt,
  getShareAuthCookieName,
  ShareAuthPayload,
} from "@/lib/utils/shareAuthJwt";
import { ShareTokenParamsSchema } from "@/schemas/shareTokenSchema";
import { SharedContentMetadata } from "@/types/share";

export const GET = withLoggerAndErrorHandler(
  async (_, props: ContextWithId) => {
    const parseTokenResult = ShareTokenParamsSchema.safeParse(props);
    if (!parseTokenResult.success) {
      return errorResponse(
        "Invalid share token format",
        400,
        parseTokenResult.error.flatten()
      );
    }
    const { token } = parseTokenResult.data.params;

    const cookieStore = await cookies();
    const authCookieName = getShareAuthCookieName(token);
    const authCookie = cookieStore.get(authCookieName);

    let decodedJwt: ShareAuthPayload | null = null;

    if (authCookie) {
      decodedJwt = verifyShareAuthJwt(authCookie.value, token);
    }
    const isAuthenticatedByCookie = !!decodedJwt;

    try {
      const sharedLink = await prisma.sharedLink.findUnique({
        where: { token },
        select: {
          id: true,
          userId: true,
          fileId: true,
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

      const hasPasswordProtection = sharedLink.password !== null;

      if (hasPasswordProtection) {
        if (!isAuthenticatedByCookie) {
          return errorResponse("Password required for this shared link", 401);
        }
      }

      let sharedContent: SharedContentMetadata;

      if (sharedLink.fileId) {
        const file = await prisma.file.findUnique({
          where: { id: sharedLink.fileId },
          select: {
            id: true,
            name: true,
            path: true,
            fileUrl: true,
            size: true,
            userId: true,
            isTrash: true,
          },
        });

        if (!file) {
          return errorResponse(
            "Shared file not found or no longer exists",
            404
          );
        }
        if (file.userId !== sharedLink.userId) {
          return errorResponse(
            "Authorization failed: Content owner mismatch",
            403
          );
        }
        if (file.isTrash) {
          return errorResponse(
            "Shared content is in trash and cannot be accessed",
            403
          );
        }

        sharedContent = {
          type: "file",
          id: file.id,
          name: file.name,
          path: file.path,
          fileUrl: file.fileUrl,
          size: file.size,
          hasPassword: hasPasswordProtection,
          expiresAt: sharedLink.expiresAt,
        };
      } else if (sharedLink.folderId) {
        const folder = await prisma.folder.findUnique({
          where: { id: sharedLink.folderId },
          select: {
            id: true,
            name: true,
            path: true,
            userId: true,
            isTrash: true,
          },
        });

        if (!folder) {
          return errorResponse(
            "Shared folder not found or no longer exists",
            404
          );
        }
        if (folder.userId !== sharedLink.userId) {
          return errorResponse(
            "Authorization failed: Content owner mismatch",
            403
          );
        }
        if (folder.isTrash) {
          return errorResponse(
            "Shared content is in trash and cannot be accessed",
            403
          );
        }

        sharedContent = {
          type: "folder",
          id: folder.id,
          name: folder.name,
          path: folder.path,
          hasPassword: hasPasswordProtection,
          expiresAt: sharedLink.expiresAt,
        };
      } else {
        return errorResponse(
          "Shared link is invalid: No content associated",
          500
        );
      }

      return successResponse<SharedContentMetadata>(
        "Shared content metadata fetched successfully",
        200,
        sharedContent
      );
    } catch (error: any) {
      return errorResponse(
        "Failed to access shared content",
        500,
        error.message
      );
    }
  }
);
