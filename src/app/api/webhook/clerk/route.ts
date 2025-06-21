import type { NextRequest } from "next/server";
import { headers } from "next/headers";
import { withLoggerAndErrorHandler } from "@/lib/withLoggerAndErrorHandler";
import { errorResponse, successResponse } from "@/lib/responseWrapper";
import prisma from "@/lib/prisma";
import { WebhookEvent } from "@clerk/nextjs/server";
import { Webhook } from "svix";
import logger from "@/lib/logger";

// Handle user creation
async function handleUserCreated(
  data: any,
  svixId: string,
  svixTimestamp: string
) {
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
    return errorResponse("Email address not found", 400);
  }

  const { email_address } = emailAddress;

  await prisma.user.create({
    data: {
      id: data.id,
      email: email_address,
    },
  });

  await prisma.subscription.create({
    data: {
      userId: data.id,
      plan: "FREE",
    },
  });

  return null;
}

// Handle user update
async function handleUserUpdated(
  data: any,
  svixId: string,
  svixTimestamp: string
) {
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
    return errorResponse("Email address not found", 400);
  }

  const { email_address } = emailAddress;

  const user = await prisma.user.findUnique({
    where: { id: data.id },
  });

  if (!user) {
    return errorResponse("User not found", 404);
  }

  await prisma.user.update({
    where: { id: data.id },
    data: {
      email: email_address,
    },
  });

  return null;
}

// Handle user deletion
async function handleUserDeleted(
  data: any,
  svixId: string,
  svixTimestamp: string
) {
  logger.info("User deleted webhook received", {
    eventType: "user.deleted",
    userId: data.id,
    eventId: svixId,
    timestamp: svixTimestamp,
  });

  // Delete user's subscription first (due to foreign key constraint)
  await prisma.subscription.delete({
    where: { userId: data.id },
  });

  // Then delete the user
  await prisma.user.delete({
    where: { id: data.id },
  });

  return null;
}

export const POST = withLoggerAndErrorHandler(async (request: NextRequest) => {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

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
    return errorResponse("Error verifying webhook", 400);
  }

  const { type, data } = evt;

  try {
    switch (type) {
      case "user.created":
        const createResult = await handleUserCreated(
          data,
          svixId,
          svixTimestamp
        );
        if (createResult) return createResult;
        break;

      case "user.updated":
        const updateResult = await handleUserUpdated(
          data,
          svixId,
          svixTimestamp
        );
        if (updateResult) return updateResult;
        break;

      case "user.deleted":
        const deleteResult = await handleUserDeleted(
          data,
          svixId,
          svixTimestamp
        );
        if (deleteResult) return deleteResult;
        break;

      default:
        return errorResponse(`Unsupported webhook type: ${type}`, 400);
    }
  } catch (err) {
    return errorResponse(
      err instanceof Error ? err.message : `Error processing ${type} webhook`,
      500,
      err
    );
  }

  return successResponse("Webhook processed successfully", 200);
});
