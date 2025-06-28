import { withLoggerAndErrorHandler } from "@/lib/api/withLoggerAndErrorHandler";
import { successResponse, errorResponse } from "@/lib/utils/responseWrapper";
import stripe from "@/lib/stripe/stripe";
import prisma from "@/lib/prisma/prisma";
import logger from "@/lib/utils/logger";
import { type NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import {
  StripeCheckoutSessionMetadata,
  getPlanFromPriceId,
} from "@/types/stripe";
import { SubscriptionStatus } from "@prisma/client";

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  return await prisma.$transaction(async (tx) => {
    const priceId = subscription.items.data[0].price.id;
    const plan = getPlanFromPriceId(priceId);
    const { userId } = subscription.metadata as StripeCheckoutSessionMetadata;

    if (!userId) {
      logger.warn("Missing userId in subscription metadata", {
        subscriptionId: subscription.id,
        eventType: "customer.subscription.created",
      });
      throw new Error("Missing userId metadata for subscription creation");
    }

    const existing = await tx.subscription.findUnique({
      where: { userId },
    });

    if (!existing) {
      await tx.subscription.create({
        data: {
          userId,
          plan,
          status: "ACTIVE",
          stripeCustomerId: subscription.customer as string,
          stripeSubscriptionId: subscription.id,
          stripePriceId: priceId,
          currentPeriodEnd: subscription.items.data[0].current_period_end
            ? new Date(subscription.items.data[0].current_period_end * 1000)
            : undefined,
        },
      });

      logger.info("Subscription created and stored", {
        stripeSubscriptionId: subscription.id,
        userId,
        plan,
        eventType: "customer.subscription.created",
      });
    } else {
      await tx.subscription.update({
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

      logger.info("Existing subscription updated on create (idempotency)", {
        stripeSubscriptionId: subscription.id,
        userId,
        plan,
        eventType: "customer.subscription.created",
      });
    }

    return null;
  });
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  return await prisma.$transaction(async (tx) => {
    const userSubscription = await tx.subscription.findUnique({
      where: {
        stripeSubscriptionId: subscription.id,
      },
    });

    if (!userSubscription) {
      logger.warn("Subscription not found in database for update event", {
        stripeSubscriptionId: subscription.id,
        eventType: "customer.subscription.updated",
      });
      throw new Error("No matching subscription found for update");
    }

    const priceId = subscription.items.data[0]?.price.id;
    const plan = getPlanFromPriceId(priceId);

    const newStatus = subscription.cancel_at_period_end
      ? "CANCEL_SCHEDULED"
      : subscription.status === "active"
      ? "ACTIVE"
      : "INACTIVE";

    const newPeriodEnd = subscription.items.data[0].current_period_end
      ? new Date(subscription.items.data[0].current_period_end * 1000)
      : userSubscription.currentPeriodEnd;

    await tx.subscription.update({
      where: {
        stripeSubscriptionId: subscription.id,
      },
      data: {
        plan,
        status: newStatus as SubscriptionStatus,
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
  });
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  return await prisma.$transaction(async (tx) => {
    const userSubscription = await tx.subscription.findUnique({
      where: {
        stripeSubscriptionId: subscription.id,
      },
    });

    if (!userSubscription) {
      logger.warn("Subscription not found in database for delete event", {
        stripeSubscriptionId: subscription.id,
        eventType: "customer.subscription.deleted",
      });
      throw new Error("No matching subscription found for delete");
    }

    await tx.subscription.update({
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
  });
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
    let handlerResult: any = null;

    switch (event.type) {
      case "customer.subscription.created":
        const subscription1 = event.data.object as Stripe.Subscription;
        handlerResult = await handleSubscriptionCreated(subscription1);
        break;

      case "customer.subscription.updated":
        const subscription2 = event.data.object as Stripe.Subscription;
        handlerResult = await handleSubscriptionUpdated(subscription2);
        break;

      case "customer.subscription.deleted":
        const subscription3 = event.data.object as Stripe.Subscription;
        handlerResult = await handleSubscriptionDeleted(subscription3);
        break;

      default:
        handlerResult = handleUnknownEvent(event.type, event.id);
        break;
    }

    if (handlerResult instanceof NextResponse) {
      return handlerResult;
    }
  } catch (err) {
    logger.error(
      `Error processing Stripe webhook event type ${event.type}:`,
      err
    );
    return errorResponse(
      err instanceof Error
        ? err.message
        : `Error processing ${event.type} webhook`,
      500,
      err instanceof Error ? err.message : undefined
    );
  }

  return successResponse("Webhook processed successfully", 200);
});
