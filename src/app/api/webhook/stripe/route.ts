import { withLoggerAndErrorHandler } from "@/lib/api/withLoggerAndErrorHandler";
import { successResponse, errorResponse } from "@/lib/utils/responseWrapper";
import stripe from "@/lib/stripe/stripe";
import prisma from "@/lib/prisma/prisma";
import logger from "@/lib/utils/logger";
import type { NextRequest } from "next/server";
import type Stripe from "stripe";
import {
  StripeCheckoutSessionMetadata,
  getPlanFromPriceId,
} from "@/types/stripe";

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  const priceId = subscription.items.data[0].price.id;
  const plan = getPlanFromPriceId(priceId);
  const { userId } = subscription.metadata as StripeCheckoutSessionMetadata;

  if (!userId) {
    logger.warn("Missing userId in subscription metadata", {
      subscriptionId: subscription.id,
      eventType: "customer.subscription.created",
    });

    return errorResponse("Missing userId metadata", 400);
  }

  const existing = await prisma.subscription.findUnique({
    where: { userId },
  });

  if (!existing) {
    await prisma.subscription.create({
      data: {
        userId,
        plan,
        status: "ACTIVE",
        stripeCustomerId: subscription.customer as string,
        stripeSubscriptionId: subscription.id,
        stripePriceId: priceId,
      },
    });

    logger.info("Subscription created and stored", {
      stripeSubscriptionId: subscription.id,
      userId,
      plan,
      eventType: "customer.subscription.created",
    });
  } else {
    await prisma.subscription.update({
      where: { userId },
      data: {
        plan,
        status: "ACTIVE",
        stripeCustomerId: subscription.customer as string,
        stripeSubscriptionId: subscription.id,
        stripePriceId: priceId,
        currentPeriodEnd: new Date(
          subscription.items.data[0].current_period_end * 1000
        ),
      },
    });

    logger.info("Existing subscription updated on create", {
      stripeSubscriptionId: subscription.id,
      userId,
      plan,
      eventType: "customer.subscription.created",
    });
  }

  return null;
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const userSubscription = await prisma.subscription.findUnique({
    where: {
      stripeSubscriptionId: subscription.id,
    },
  });

  if (!userSubscription) {
    logger.warn("Subscription not found in database", {
      stripeSubscriptionId: subscription.id,
      eventType: "customer.subscription.updated",
    });

    return errorResponse("No matching subscription found", 404);
  }

  const priceId = subscription.items.data[0]?.price.id;
  const plan = getPlanFromPriceId(priceId);

  const newStatus = subscription.cancel_at_period_end
    ? "CANCEL_SCHEDULED"
    : "ACTIVE";

  const newPeriodEnd = new Date(
    subscription.items.data[0].current_period_end * 1000
  );

  await prisma.subscription.update({
    where: {
      stripeSubscriptionId: subscription.id,
    },
    data: {
      plan,
      status: newStatus,
      stripePriceId: priceId,
      currentPeriodEnd: newPeriodEnd,
    },
  });

  logger.info("Subscription updated event processed", {
    stripeSubscriptionId: subscription.id,
    status: newStatus,
    stripePriceId: priceId,
    eventType: "customer.subscription.updated",
  });

  return null;
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const userSubscription = await prisma.subscription.findUnique({
    where: {
      stripeSubscriptionId: subscription.id,
    },
  });

  if (!userSubscription) {
    logger.warn("Subscription not found in database", {
      stripeSubscriptionId: subscription.id,
      eventType: "customer.subscription.deleted",
    });
    return errorResponse("No matching subscription found", 404);
  }

  await prisma.subscription.update({
    where: {
      stripeSubscriptionId: subscription.id,
    },
    data: {
      plan: "FREE",
      status: "CANCELLED",
      stripeSubscriptionId: null,
      stripePriceId: null,
      currentPeriodEnd: null,
    },
  });

  logger.info("Subscription deleted event processed", {
    stripeSubscriptionId: subscription.id,
    eventType: "customer.subscription.deleted",
  });

  return null;
}

function handleUnknownEvent(eventType: string, eventId: string) {
  logger.warn("Unhandled Stripe webhook event type", {
    eventType: eventType,
    eventId: eventId,
  });
  return null;
}

export const POST = withLoggerAndErrorHandler(async (request: NextRequest) => {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  if (!sig) {
    return errorResponse("Stripe signature is required", 400);
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
  } catch (error: any) {
    logger.error("Stripe webhook signature verification failed", {
      error: error.message,
    });
    return errorResponse(`Webhook Error: ${error.message}`, 400);
  }

  logger.info("Processing Stripe webhook", {
    eventType: event.type,
    eventId: event.id,
  });

  try {
    switch (event.type) {
      case "customer.subscription.created":
        const subscription1 = event.data.object as Stripe.Subscription;
        const createResult = await handleSubscriptionCreated(subscription1);
        if (createResult) return createResult;
        break;

      case "customer.subscription.updated":
        const subscription2 = event.data.object as Stripe.Subscription;
        const updateResult = await handleSubscriptionUpdated(subscription2);
        if (updateResult) return updateResult;
        break;

      case "customer.subscription.deleted":
        const subscription3 = event.data.object as Stripe.Subscription;
        const deleteResult = await handleSubscriptionDeleted(subscription3);
        if (deleteResult) return deleteResult;
        break;

      default:
        const unknownResult = handleUnknownEvent(event.type, event.id);
        if (unknownResult) return unknownResult;
        break;
    }
  } catch (err) {
    return errorResponse(
      err instanceof Error
        ? err.message
        : `Error processing ${event.type} webhook`,
      500,
      err
    );
  }

  return successResponse("Webhook processed successfully", 200);
});
