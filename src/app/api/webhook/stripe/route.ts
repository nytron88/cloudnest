import { withLoggerAndErrorHandler } from "@/lib/withLoggerAndErrorHandler";
import { successResponse, errorResponse } from "@/lib/responseWrapper";
import stripe from "@/lib/stripe";
import prisma from "@/lib/prisma";
import logger from "@/lib/logger";
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
    return successResponse("Missing userId metadata", 200);
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

  return successResponse("Subscription created handled", 200);
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

    return successResponse(
      "No matching subscription; probably not created yet.",
      200
    );
  }

  const priceId = subscription.items.data[0]?.price.id;
  const plan = getPlanFromPriceId(priceId);

  const newStatus = subscription.cancel_at_period_end
    ? "CANCEL_SCHEDULED"
    : "ACTIVE";

  await prisma.subscription.update({
    where: {
      stripeSubscriptionId: subscription.id,
    },
    data: {
      plan,
      status: newStatus,
      stripePriceId: priceId,
    },
  });

  logger.info("Subscription updated event processed", {
    stripeSubscriptionId: subscription.id,
    status: newStatus,
    stripePriceId: priceId,
    eventType: "customer.subscription.updated",
  });

  return successResponse("Webhook received", 200);
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
    return successResponse(
      "No matching subscription; probably not created yet.",
      200
    );
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

  return successResponse("Webhook received", 200);
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  const subscriptionId = invoice.lines.data?.[0]?.parent
    ?.subscription_item_details?.subscription as string | undefined;

  if (!subscriptionId) {
    logger.warn("Invoice missing subscription ID", {
      invoiceId: invoice.id,
      eventType: "invoice.payment_succeeded",
    });
    return successResponse("Missing subscription ID", 200);
  }

  const userSubscription = await prisma.subscription.findUnique({
    where: { stripeSubscriptionId: subscriptionId },
  });

  if (!userSubscription) {
    logger.warn("No matching subscription for invoice", {
      subscriptionId,
      invoiceId: invoice.id,
      eventType: "invoice.payment_succeeded",
    });
    return successResponse("No matching subscription", 200);
  }

  const newPeriodEnd = new Date(invoice.lines.data?.[0]?.period?.end * 1000);

  await prisma.subscription.update({
    where: { stripeSubscriptionId: subscriptionId },
    data: {
      currentPeriodEnd: newPeriodEnd,
      status: "ACTIVE", // In case it was in trial or pending
    },
  });

  logger.info("Subscription updated from invoice payment", {
    subscriptionId,
    invoiceId: invoice.id,
    newPeriodEnd,
  });

  return successResponse("Invoice payment handled", 200);
}

function handleUnknownEvent(eventType: string, eventId: string) {
  logger.warn("Unhandled Stripe webhook event type", {
    eventType: eventType,
    eventId: eventId,
  });
  return successResponse("Ignored", 200);
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

  switch (event.type) {
    case "customer.subscription.created": {
      const subscription = event.data.object as Stripe.Subscription;
      return await handleSubscriptionCreated(subscription);
    }

    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      return await handleSubscriptionUpdated(subscription);
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      return await handleSubscriptionDeleted(subscription);
    }

    case "invoice.payment_succeeded": {
      const invoice = event.data.object as Stripe.Invoice & { parent?: any };
      return await handleInvoicePaymentSucceeded(invoice);
    }

    default:
      return handleUnknownEvent(event.type, event.id);
  }
});
