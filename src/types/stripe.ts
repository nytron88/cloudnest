import type Stripe from "stripe";
import { SubscriptionPlan } from "@prisma/client";

export type StripeCreateCheckoutSessionResponse = {
  id: string;
};

export type StripeCheckoutSession = Stripe.Checkout.Session;

export type StripeCreatePortalSessionResponse = {
  url: string;
};

const PRO_MONTHLY_PRICE_ID = process.env.STRIPE_PRO_PRODUCT_ID!;
const PRO_YEARLY_PRICE_ID = process.env.STRIPE_PRO_YEARLY_PRODUCT_ID!;

export const priceIdToPlanMap = {
  [PRO_MONTHLY_PRICE_ID]: SubscriptionPlan.PRO_MONTHLY,
  [PRO_YEARLY_PRICE_ID]: SubscriptionPlan.PRO_YEARLY,
} as const;

export type StripePlan = Exclude<SubscriptionPlan, "FREE">;

export function getPlanFromPriceId(priceId: string): StripePlan | "FREE" {
  return priceIdToPlanMap[priceId as keyof typeof priceIdToPlanMap] ?? "FREE";
}

export type StripeCheckoutSessionMetadata = {
  userId: string;
};
