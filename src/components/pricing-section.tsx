"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check } from "lucide-react";
import { SubscriptionPlan } from "@/types/subscription";
import { StripeCreateCheckoutSessionResponse } from "@/types/stripe";
import { APIResponse } from "@/types/apiResponse";
import axios from "axios";
import { toast } from "sonner";
import { stripePromise } from "@/lib/stripe-client";

interface PricingSectionProps {
  plans: SubscriptionPlan[];
  currentPlanId?: string | null; // The user's current plan ID
}

export function PricingSection({ plans, currentPlanId }: PricingSectionProps) {
  const [selectedInterval, setSelectedInterval] = useState<"month" | "year">("month");

  // Filter and sort plans by selected interval
  const filteredPlans = plans
    .filter(plan => plan.interval === selectedInterval)
    .sort((a, b) => a.price - b.price);

  const handlePlanClick = async (planId: string) => {
    const stripe = await stripePromise;
    try {
      const res = await axios.post<APIResponse<StripeCreateCheckoutSessionResponse>>("/api/stripe/create-checkout-session", {
        priceId: planId,
      });

      if (res.data?.payload?.id) {
        const result = await stripe?.redirectToCheckout({ sessionId: res.data.payload.id });

        if (result?.error) {
          toast.error("Stripe redirect failed", {
            description: result.error.message || "Please try again later"
          });
        }
      } else {
        toast.error("Failed to create checkout session", {
          description: "Please try again later"
        });
      }
    } catch (err: any) {
      toast.error("Error creating checkout session", {
        description: err.response?.data?.message || "Please check your connection and try again"
      });
    }
  };

  const handleManageSubscription = async (planId: string) => {
    // TODO: Implement this
  };

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold mb-4">Choose Your Plan</h2>
        <p className="text-muted-foreground mb-8">
          Start with our free tier or upgrade to a premium plan for more storage and features.
        </p>

        {/* Billing Toggle */}
        <div className="inline-flex items-center bg-muted rounded-lg p-1 mb-8">
          <button
            onClick={() => setSelectedInterval("month")}
            className={`px-6 py-2 rounded-md text-sm font-medium transition-all cursor-pointer ${selectedInterval === "month"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
              }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setSelectedInterval("year")}
            className={`px-6 py-2 rounded-md text-sm font-medium transition-all cursor-pointer ${selectedInterval === "year"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
              }`}
          >
            Yearly
            <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded-full">
              Save 20%
            </span>
          </button>
        </div>
      </div>

      <div className={`grid gap-6 lg:gap-8 mx-auto justify-center ${filteredPlans.length === 0
        ? "grid-cols-1 max-w-sm"
        : filteredPlans.length === 1
          ? "grid-cols-1 md:grid-cols-2 max-w-2xl"
          : filteredPlans.length === 2
            ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 max-w-4xl"
            : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 max-w-6xl"
        }`}>
        {/* Free Tier */}
        <Card className={`relative border-2 hover:border-primary/20 hover:shadow-lg transition-all duration-300 w-full max-w-sm justify-self-center h-[380px] flex flex-col bg-gradient-to-b from-background to-muted/20 ${currentPlanId === null ? 'border-primary bg-primary/5' : ''}`}>
          <CardHeader className="text-center pb-2 h-[100px] flex flex-col justify-center pt-4">
            <CardTitle className="text-2xl font-bold">Free</CardTitle>
            <div className="text-4xl font-bold py-2">
              $0<span className="text-lg font-normal text-muted-foreground">/{selectedInterval}</span>
              <div className="h-4"></div>
            </div>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col px-6 pb-6">
            <ul className="space-y-1 flex-1">
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                <span className="text-sm">1GB Storage</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                <span className="text-sm">Basic File Upload</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                <span className="text-sm">Advanced Security</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                <span className="text-sm">Web Access</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                <span className="text-sm">File Sharing & Links</span>
              </li>
            </ul>
            <div className="mt-4">
              {currentPlanId === null ? (
                <Button className="w-full" disabled>
                  Current Plan
                </Button>
              ) : currentPlanId ? (
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() => handleManageSubscription("free")}
                >
                  Downgrade to Free
                </Button>
              ) : (
                <Link href="/sign-up" className="block">
                  <Button className="w-full">Get Started Free</Button>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Dynamic Subscription Plans */}
        {filteredPlans.map((plan, index) => {
          const isCurrentPlan = currentPlanId === plan.id;
          return (
            <Card key={plan.id} className={`relative border-2 hover:border-primary/20 hover:shadow-lg transition-all duration-300 w-full max-w-sm justify-self-center h-[380px] flex flex-col bg-gradient-to-b from-background to-muted/20 ${isCurrentPlan ? 'border-primary bg-primary/5' : ''}`}>
              {index === 0 && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-medium">
                    Most Popular
                  </span>
                </div>
              )}
              <CardHeader className="text-center pb-2 h-[100px] flex flex-col justify-center pt-4">
                <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                <div className="text-4xl font-bold py-2">
                  {plan.formattedPrice}
                  <span className="text-lg font-normal text-muted-foreground">/{plan.interval}</span>
                  <div className="h-4"></div>
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col px-6 pb-6">
                <ul className="space-y-1 flex-1">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                    <span className="text-sm">Everything in Free</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                    <span className="text-sm">{plan.interval === 'year' ? '1TB' : '50GB'} Storage</span>
                  </li>
                  {plan.interval === 'year' && (
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span className="text-sm">Save 20% and get extra storage vs monthly</span>
                    </li>
                  )}
                </ul>
                <div className="mt-4">
                  {isCurrentPlan ? (
                    <Button className="w-full" disabled>
                      Current Plan
                    </Button>
                  ) : currentPlanId ? (
                    // User has a paid plan, show manage subscription button for other plans
                    <Button
                      className="w-full"
                      onClick={() => handleManageSubscription(plan.id)}
                    >
                      Manage Subscription
                    </Button>
                  ) : currentPlanId === null ? (
                    // User is authenticated but on free tier, show create new subscription
                    <Button
                      className="w-full"
                      onClick={() => handlePlanClick(plan.id)}
                    >
                      Choose {plan.name}
                    </Button>
                  ) : (
                    // User is not authenticated, show sign up
                    <Link href="/sign-up" className="block">
                      <Button className="w-full">
                        Choose {plan.name}
                      </Button>
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
} 