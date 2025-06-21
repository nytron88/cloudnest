import { withLoggerAndErrorHandler } from "@/lib/withLoggerAndErrorHandler";
import { successResponse, errorResponse } from "@/lib/responseWrapper";
import stripe from "@/lib/stripe";
import prisma from "@/lib/prisma";
import logger from "@/lib/logger";
import type { NextRequest } from "next/server";
import type Stripe from "stripe";
import { StripeCheckoutSessionMetadata } from "@/types/stripe";
import { SubscriptionPlan } from "@prisma/client";

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

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

  // handle subscription updates (plan changes, renewals, etc.)
  logger.info("Subscription updated event processed", {
    stripeSubscriptionId: subscription.id,
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

  // handle subscription cancellation/deletion
  logger.info("Subscription deleted event processed", {
    stripeSubscriptionId: subscription.id,
    eventType: "customer.subscription.deleted",
  });

  return successResponse("Webhook received", 200);
}

async function handleInvoicePaymentSucceeded(
  invoice: Stripe.Invoice & { parent?: any }
) {
  if (!invoice.parent || invoice.parent.type !== "subscription_details") {
    logger.warn("Invoice is not a subscription", {
      invoiceId: invoice.id,
      eventType: "invoice.payment_succeeded",
    });
    return successResponse("No matching subscription", 200);
  }

  const subscriptionId = invoice.parent.subscription_details?.subscription;

  if (!subscriptionId) {
    logger.warn("Subscription ID not found", {
      invoiceId: invoice.id,
      eventType: "invoice.payment_succeeded",
    });
    return successResponse("No matching subscription", 200);
  }

  const { userId, plan } = (invoice.parent.subscription_details?.metadata ??
    {}) as StripeCheckoutSessionMetadata;

  if (!userId || !plan) {
    logger.warn("Metadata missing userId or plan", {
      invoiceId: invoice.id,
      eventType: "invoice.payment_succeeded",
    });
    return successResponse("Missing metadata", 200);
  }

  const userSubscription = await prisma.subscription.findUnique({
    where: { userId },
  });

  if (!userSubscription) {
    logger.warn("Subscription not found in database", {
      userId,
      eventType: "invoice.payment_succeeded",
    });
    return successResponse("No matching subscription", 200);
  }

  await prisma.subscription.update({
    where: { userId },
    data: {
      plan: plan as SubscriptionPlan,
      stripeCustomerId: invoice.customer as string,
      stripeSubscriptionId: subscriptionId,
      stripePriceId: invoice.lines.data?.[0]?.pricing?.price_details?.price,
      currentPeriodEnd: new Date(invoice.lines.data?.[0]?.period?.end * 1000),
    },
  });

  logger.info("Subscription updated from invoice payment", {
    subscriptionId,
    invoiceId: invoice.id,
    newPeriodEnd: new Date(invoice.lines.data?.[0]?.period?.end * 1000),
  });

  return successResponse("Webhook received", 200);
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
