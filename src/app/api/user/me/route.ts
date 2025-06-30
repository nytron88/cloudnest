import { withLoggerAndErrorHandler } from "@/lib/api/withLoggerAndErrorHandler";
import { errorResponse, successResponse } from "@/lib/utils/responseWrapper";
import { requireAuth } from "@/lib/api/requireAuth";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma/prisma";
import { UserProfileResponseData } from "@/types/user";

export const GET = withLoggerAndErrorHandler(async () => {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  const { userId } = auth;

  try {
    const userProfileData = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        usedStorage: true,
        subscription: {
          select: {
            plan: true,
            status: true,
            currentPeriodEnd: true,
          },
        },
        _count: {
          select: {
            folders: {
              where: { isTrash: false },
            },
            files: {
              where: { isTrash: false },
            },
            sharedLinks: true,
          },
        },
      },
    });

    if (!userProfileData) {
      return errorResponse("User profile not found", 404);
    }

    const { _count, subscription, ...userBasicData } = userProfileData;

    const userProfile: UserProfileResponseData = {
      ...userBasicData,
      totalFolders: _count.folders,
      totalFiles: _count.files,
      totalSharedLinks: _count.sharedLinks,
      subscription: subscription
        ? {
            plan: subscription.plan,
            status: subscription.status,
            currentPeriodEnd: subscription.currentPeriodEnd,
          }
        : null,
    };

    return successResponse<UserProfileResponseData>(
      "User profile fetched successfully",
      200,
      userProfile
    );
  } catch (error: any) {
    return errorResponse("Failed to fetch user profile", 500, error.message);
  }
});
