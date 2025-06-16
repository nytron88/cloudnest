import type { NextRequest } from "next/server";
import { headers } from "next/headers";
import { withLoggerAndErrorHandler } from "@/lib/withLoggerAndErrorHandler";
import { errorResponse, successResponse } from "@/lib/responseWrapper";
import prisma from "@/lib/prisma";
import { WebhookEvent } from "@clerk/nextjs/server";
import { Webhook } from "svix";
import logger from "@/lib/logger";

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

  if (type !== "user.created") {
    return errorResponse("Invalid webhook type", 400);
  }

  logger.info("Webhook received", {
    eventType: type,
    userId: data.id,
    eventId: svixId,
    email: data.email_addresses?.find(
      (email: any) => email.id === data.primary_email_address_id
    )?.email_address,
    timestamp: svixTimestamp,
  });

  try {
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
  } catch (err) {
    return errorResponse(
      err instanceof Error ? err.message : "Error creating user in database",
      500,
      err
    );
  }

  return successResponse("Webhook processed successfully", 200);
});
