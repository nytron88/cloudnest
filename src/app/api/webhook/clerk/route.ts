import { type NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { withLoggerAndErrorHandler } from "@/lib/api/withLoggerAndErrorHandler";
import { errorResponse, successResponse } from "@/lib/utils/responseWrapper";
import prisma from "@/lib/prisma/prisma";
import { WebhookEvent } from "@clerk/nextjs/server";
import { Webhook } from "svix";
import logger from "@/lib/utils/logger";
import { safeBulkDeleteFiles } from "@/lib/imagekit/safeBulkDeleteFiles";

const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

async function handleUserCreated(
  data: any,
  svixId: string,
  svixTimestamp: string
) {
  return await prisma.$transaction(async (tx) => {
    logger.info("User created webhook received", {
      eventType: "user.created",
      userId: data.id,
      eventId: svixId,
      email: data.email_addresses?.find(
        (email: any) => email.id === data.primary_email_address_id
      )?.email_address,
      timestamp: svixTimestamp,
    });

    const { email_addresses, primary_email_address_id } = data;

    const emailAddress = email_addresses.find(
      (email: { id: string }) => email.id === primary_email_address_id
    );

    if (!emailAddress) {
      throw new Error("Email address not found for user creation");
    }

    const { email_address } = emailAddress;

    const existingUser = await tx.user.findUnique({ where: { id: data.id } });
    if (existingUser) {
      logger.warn(
        "User already exists, skipping creation but updating if needed (idempotency)",
        { userId: data.id }
      );
      await tx.user.update({
        where: { id: data.id },
        data: { email: email_address },
      });
      const existingSubscription = await tx.subscription.findUnique({
        where: { userId: data.id },
      });
      if (!existingSubscription) {
        await tx.subscription.create({
          data: { userId: data.id, plan: "FREE" },
        });
      }
      return null;
    }

    await tx.user.create({
      data: {
        id: data.id,
        email: email_address,
      },
    });

    await tx.subscription.create({
      data: {
        userId: data.id,
        plan: "FREE",
      },
    });

    logger.info("User and default subscription created", {
      userId: data.id,
      eventType: "user.created",
    });

    return null;
  });
}

async function handleUserUpdated(
  data: any,
  svixId: string,
  svixTimestamp: string
) {
  return await prisma.$transaction(async (tx) => {
    logger.info("User updated webhook received", {
      eventType: "user.updated",
      userId: data.id,
      eventId: svixId,
      email: data.email_addresses?.find(
        (email: any) => email.id === data.primary_email_address_id
      )?.email_address,
      timestamp: svixTimestamp,
    });

    const { email_addresses, primary_email_address_id } = data;

    const emailAddress = email_addresses.find(
      (email: { id: string }) => email.id === primary_email_address_id
    );

    if (!emailAddress) {
      throw new Error("Email address not found for user update");
    }

    const { email_address } = emailAddress;

    const user = await tx.user.findUnique({
      where: { id: data.id },
    });

    if (!user) {
      logger.warn(
        "User not found in database for update event, skipping update",
        { userId: data.id }
      );
      return null;
    }

    await tx.user.update({
      where: { id: data.id },
      data: {
        email: email_address,
      },
    });

    logger.info("User updated event processed", {
      userId: data.id,
      eventType: "user.updated",
    });

    return null;
  });
}

async function handleUserDeleted(
  data: any,
  svixId: string,
  svixTimestamp: string
) {
  return await prisma.$transaction(async (tx) => {
    logger.info("User deleted webhook received", {
      eventType: "user.deleted",
      userId: data.id,
      eventId: svixId,
      timestamp: svixTimestamp,
    });

    const userToDelete = await tx.user.findUnique({ where: { id: data.id } });
    if (!userToDelete) {
      logger.warn("User not found in database for delete event, skipping", {
        userId: data.id,
      });
      return null;
    }

    const userFiles = await tx.file.findMany({
      where: { userId: data.id },
      select: { imagekitFileId: true, size: true },
    });

    const imagekitFileIds = userFiles.map((f) => f.imagekitFileId);
    const totalBytesFreed = userFiles.reduce((sum, f) => sum + f.size, 0);

    if (imagekitFileIds.length > 0) {
      await safeBulkDeleteFiles(imagekitFileIds, {
        method: "DELETE",
        url: `clerk-webhook-user.deleted-${data.id}`,
      });
    }

    await tx.sharedLink.deleteMany({
      where: { userId: data.id },
    });

    await tx.file.deleteMany({
      where: { userId: data.id },
    });

    await tx.folder.deleteMany({
      where: { userId: data.id },
    });

    await tx.subscription.deleteMany({
      where: { userId: data.id },
    });

    await tx.user.delete({
      where: { id: data.id },
    });

    await tx.user.update({
      where: { id: data.id },
      data: {
        usedStorage: {
          decrement: totalBytesFreed,
        },
      },
    });

    logger.info("User and all associated data deleted successfully", {
      userId: data.id,
      eventType: "user.deleted",
    });

    return null;
  });
}

export const POST = withLoggerAndErrorHandler(async (request: NextRequest) => {
  if (!WEBHOOK_SECRET) {
    return errorResponse("CLERK_WEBHOOK_SECRET is not set", 500);
  }

  const requestHeaders = await headers();

  const svixId = requestHeaders.get("svix-id");
  const svixTimestamp = requestHeaders.get("svix-timestamp");
  const svixSignature = requestHeaders.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return errorResponse("Missing svix headers", 400);
  }

  const payload = await request.json();

  const body = JSON.stringify(payload);

  const wh = new Webhook(WEBHOOK_SECRET);

  let evt: WebhookEvent;

  try {
    evt = wh.verify(body, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as WebhookEvent;
  } catch (err) {
    logger.error("Clerk webhook signature verification failed", {
      error: err instanceof Error ? err.message : String(err),
    });
    return errorResponse(
      `Webhook Error: ${
        err instanceof Error ? err.message : "Unknown verification error"
      }`,
      400
    );
  }

  const { type, data } = evt;

  try {
    let handlerResult: any = null;

    switch (type) {
      case "user.created":
        handlerResult = await handleUserCreated(data, svixId, svixTimestamp);
        break;

      case "user.updated":
        handlerResult = await handleUserUpdated(data, svixId, svixTimestamp);
        break;

      case "user.deleted":
        handlerResult = await handleUserDeleted(data, svixId, svixTimestamp);
        break;

      default:
        logger.warn("Unhandled Clerk webhook event type", {
          eventType: type,
          eventId: svixId,
        });
        return successResponse(
          "Unhandled webhook type, but processed successfully",
          200
        );
    }

    if (handlerResult === null) {
      return successResponse("Webhook processed successfully", 200);
    }
    if (handlerResult instanceof NextResponse) {
      return handlerResult;
    }
  } catch (err) {
    logger.error(`Error processing Clerk webhook event type ${type}:`, err);
    return errorResponse(
      err instanceof Error ? err.message : `Error processing ${type} webhook`,
      500,
      err instanceof Error ? err.message : undefined
    );
  }

  return successResponse("Webhook processed successfully", 200);
});
