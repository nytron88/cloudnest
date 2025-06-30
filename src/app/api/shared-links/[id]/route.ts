import {
  ContextWithId,
  withLoggerAndErrorHandler,
} from "@/lib/api/withLoggerAndErrorHandler";
import { errorResponse, successResponse } from "@/lib/utils/responseWrapper";
import { ShareIdParamsSchema } from "@/schemas/shareIdParamsSchema";
import { requireAuth } from "@/lib/api/requireAuth";
import { type NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma/prisma";
import { UpdateShareLinkSchema } from "@/schemas/updateShareLinkSchema";
import { SharedLink, type UpdateShareLinkBody } from "@/types/share";
import bcrypt from "bcryptjs";

const SALT_ROUNDS = 10;

export const DELETE = withLoggerAndErrorHandler(
  async (_, props: ContextWithId) => {
    const auth = await requireAuth();

    if (auth instanceof NextResponse) return auth;

    const { userId } = auth;

    const parseIdResult = ShareIdParamsSchema.safeParse(props);
    if (!parseIdResult.success) {
      return errorResponse(
        "Invalid share link ID format",
        400,
        parseIdResult.error.flatten()
      );
    }

    const { id: sharedLinkId } = parseIdResult.data.params;

    try {
      const result = await prisma.$transaction(async (tx) => {
        const sharedLink = await tx.sharedLink.findUnique({
          where: { id: sharedLinkId },
          select: { userId: true },
        });

        if (!sharedLink) {
          return errorResponse("Shared link not found", 404);
        }

        if (sharedLink.userId !== userId) {
          return errorResponse("Unauthorized", 403);
        }

        await tx.sharedLink.delete({
          where: { id: sharedLinkId },
        });

        return successResponse("Shared link revoked successfully", 200);
      });

      return result;
    } catch (error: any) {
      return errorResponse("Failed to revoke shared link", 500, error.message);
    }
  }
);

export const PATCH = withLoggerAndErrorHandler(
  async (request: NextRequest, props: ContextWithId) => {
    const auth = await requireAuth();

    if (auth instanceof NextResponse) return auth;

    const { userId } = auth;

    const parseParamsResult = ShareIdParamsSchema.safeParse(props);
    if (!parseParamsResult.success) {
      return errorResponse(
        "Invalid share link ID format",
        400,
        parseParamsResult.error.flatten()
      );
    }
    const { id: sharedLinkId } = parseParamsResult.data.params;

    let parsedBody: UpdateShareLinkBody;

    try {
      const json = await request.json();
      const parseBody = UpdateShareLinkSchema.safeParse(json);
      if (!parseBody.success) {
        return errorResponse(
          "Invalid request body for update",
          400,
          parseBody.error.flatten()
        );
      }
      parsedBody = parseBody.data;
    } catch (error) {
      return errorResponse("Invalid JSON body", 400);
    }

    const { password, expiresAt } = parsedBody;

    let hashedPassword: string | null = null;

    if (password !== undefined) {
      if (password === null) {
        hashedPassword = null;
      } else {
        try {
          hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
        } catch (hashError: any) {
          return errorResponse("Failed to process password", 500);
        }
      }
    }

    try {
      const result = await prisma.$transaction(async (tx) => {
        const sharedLink = await tx.sharedLink.findUnique({
          where: { id: sharedLinkId },
          select: { userId: true },
        });

        if (!sharedLink) {
          return errorResponse("Shared link not found", 404);
        }

        if (sharedLink.userId !== userId) {
          return errorResponse("Unauthorized", 403);
        }

        const updateData: {
          password?: string | null;
          expiresAt?: Date | null;
        } = {};

        if (password !== undefined) {
          updateData.password = hashedPassword;
        }
        if (expiresAt !== undefined) {
          updateData.expiresAt = expiresAt;
        }

        if (Object.keys(updateData).length === 0) {
          return successResponse("No valid fields provided for update", 200);
        }

        const updatedSharedLink = await tx.sharedLink.update({
          where: { id: sharedLinkId },
          data: updateData,
        });

        return successResponse<SharedLink>(
          "Shared link updated successfully",
          200,
          updatedSharedLink
        );
      });

      return result;
    } catch (error: any) {
      return errorResponse("Failed to update shared link", 500, error.message);
    }
  }
);
