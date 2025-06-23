"use server";

import stripe from "@/lib/stripe/stripe";
import { SubscriptionPlan } from "@/types/subscription";

export async function getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
  const prices = await stripe.prices.list({
    expand: ["data.product"],
    active: true,
    type: "recurring",
  });

  const plans = prices.data
    .map((price): SubscriptionPlan | null => {
      const product = price.product;

      if (typeof product === "string" || product.deleted || !product.active)
        return null;

      const amount = price.unit_amount ?? 0;

      return {
        id: price.id,
        name: product.name,
        description: product.description,
        price: amount / 100,
        formattedPrice: new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: price.currency.toUpperCase(),
        }).format(amount / 100),
        interval: price.recurring?.interval ?? "month",
        price_id: price.id,
      };
    })
    .filter((plan): plan is SubscriptionPlan => plan !== null);

  return plans;
}
