import { withLoggerAndErrorHandler } from "@/lib/withLoggerAndErrorHandler";
import { successResponse, errorResponse } from "@/lib/responseWrapper";
import stripe from "@/lib/stripe";
import prisma from "@/lib/prisma";
import logger from "@/lib/logger";
import type { NextRequest } from "next/server";
import type Stripe from "stripe";

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

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
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;

      const userSubscription = await prisma.subscription.findUnique({
        where: {
          stripeSubscriptionId: subscription.id,
        },
      });

      if (!userSubscription) {
        logger.warn("Subscription not found in database", {
          stripeSubscriptionId: subscription.id,
          eventType: event.type,
        });
        return successResponse(
          "No matching subscription; probably not created yet.",
          200
        );
      }

      // handle cancellation, pausing, downgrading, etc. here
      logger.info("Subscription event processed", {
        stripeSubscriptionId: subscription.id,
        eventType: event.type,
      });

      break;
    }

    case "invoice.payment_succeeded": {
      const invoice = event.data.object as Stripe.Invoice & { parent?: any };

      let subscriptionId: string | undefined;

      // Use the new .parent.subscription_details path
      if (invoice.parent?.type === "subscription_details") {
        subscriptionId = invoice.parent.subscription_details?.subscription;
      }

      if (!subscriptionId) {
        logger.warn("Invoice payment succeeded but no subscription ID found", {
          invoiceId: invoice.id,
        });
        return successResponse("OK", 200);
      }

      const periodEndUnix = invoice.lines?.data?.[0]?.period?.end;

      if (!periodEndUnix) {
        logger.warn("Invoice payment succeeded but no period end info found", {
          invoiceId: invoice.id,
          subscriptionId,
        });
        return successResponse("OK", 200);
      }

      const userSubscription = await prisma.subscription.findUnique({
        where: {
          stripeSubscriptionId: subscriptionId,
        },
      });

      if (!userSubscription) {
        logger.warn(
          "Invoice payment succeeded but subscription not found in database",
          {
            subscriptionId,
            invoiceId: invoice.id,
            note: "verify-session probably not run yet",
          }
        );
        return successResponse("OK", 200);
      }

      await prisma.subscription.update({
        where: {
          stripeSubscriptionId: subscriptionId,
        },
        data: {
          currentPeriodEnd: new Date(periodEndUnix * 1000),
        },
      });

      logger.info("Subscription period updated from invoice payment", {
        subscriptionId,
        invoiceId: invoice.id,
        newPeriodEnd: new Date(periodEndUnix * 1000).toISOString(),
      });

      break;
    }

    default:
      logger.warn("Unhandled Stripe webhook event type", {
        eventType: event.type,
        eventId: event.id,
      });
      return successResponse("Ignored", 200);
  }

  return successResponse("Webhook received", 200);
});
