import { withLoggerAndErrorHandler } from "@/lib/withLoggerAndErrorHandler";
import { successResponse, errorResponse } from "@/lib/responseWrapper";
import stripe from "@/lib/stripe";
import type { NextRequest } from "next/server";
import type { StripeCreateCheckoutSessionResponse } from "@/types/stripe";

export const POST = withLoggerAndErrorHandler(async (request: NextRequest) => {
  const { priceId } = await request.json();

  if (!priceId) {
    return errorResponse("Price ID is required", 400);
  }

  const origin = request.headers.get("origin");

  if (!origin) {
    return errorResponse("Origin is required", 400);
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/pricing`,
  });

  return successResponse<StripeCreateCheckoutSessionResponse>(
    "Checkout session created",
    200,
    {
      id: session.id,
    }
  );
});
