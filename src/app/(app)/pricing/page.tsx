import { Metadata } from "next";
import { getSubscriptionPlans } from "@/lib/actions/getSubscriptionPlans.server";
import { getUserSubscription } from "@/lib/actions/getUserSubscription.server";
import { PricingSection } from "@/components/pricing-section";
import { FAQSection } from "@/components/faq-section";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Zap, Cloud, Users, Globe } from "lucide-react";

export const metadata: Metadata = {
  title: "Pricing Plans - CloudNest",
  description: "Choose the perfect plan for your cloud storage needs. Upgrade, downgrade, or cancel anytime.",
};

export const revalidate = 3600;

export default async function PricingPage() {
  const subscriptionPlans = await getSubscriptionPlans();

  // Get user's current subscription
  const userSubscription = await getUserSubscription();
  const currentPlanId = userSubscription?.stripePriceId || null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header Section */}
      <div className="border-b bg-muted/20">
        <div className="container mx-auto px-4 py-12">
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold tracking-tight">
              Choose Your Perfect Plan
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Scale your storage as you grow. All plans include our core features with the flexibility to upgrade or downgrade anytime.
            </p>
          </div>
        </div>
      </div>

      {/* Pricing Section */}
      <PricingSection plans={subscriptionPlans} currentPlanId={currentPlanId} />

      {/* Features Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Everything You Need</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            All plans include these powerful features to keep your data safe and accessible.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          <Card className="text-center hover:shadow-lg transition-all duration-300 border-0 shadow-md">
            <CardHeader className="pb-6">
              <div className="mx-auto mb-4 p-3 bg-primary/10 rounded-full w-fit">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-lg mb-2">Lightning Fast</CardTitle>
              <CardDescription className="text-sm leading-relaxed">
                Global CDN ensures fast uploads and downloads worldwide
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-center hover:shadow-lg transition-all duration-300 border-0 shadow-md">
            <CardHeader className="pb-6">
              <div className="mx-auto mb-4 p-3 bg-primary/10 rounded-full w-fit">
                <Cloud className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-lg mb-2">99.9% Uptime</CardTitle>
              <CardDescription className="text-sm leading-relaxed">
                Reliable cloud infrastructure with automatic backups
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-center hover:shadow-lg transition-all duration-300 border-0 shadow-md">
            <CardHeader className="pb-6">
              <div className="mx-auto mb-4 p-3 bg-primary/10 rounded-full w-fit">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-lg mb-2">Easy Sharing</CardTitle>
              <CardDescription className="text-sm leading-relaxed">
                Share files and folders with customizable permissions
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-center hover:shadow-lg transition-all duration-300 border-0 shadow-md">
            <CardHeader className="pb-6">
              <div className="mx-auto mb-4 p-3 bg-primary/10 rounded-full w-fit">
                <Globe className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-lg mb-2">Access Anywhere</CardTitle>
              <CardDescription className="text-sm leading-relaxed">
                Web, mobile, and desktop apps for all your devices
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>

      {/* FAQ Section */}
      <FAQSection
        faqs={[
          {
            question: "Can I change my plan anytime?",
            answer: "You can change after the current one is finished and cancel any future ones through manage subscription page."
          },
          {
            question: "What happens if I exceed my storage?",
            answer: "We'll notify you when you're approaching your limit. You can upgrade your plan or remove files to free up space."
          },
          {
            question: "Is my data secure?",
            answer: "Absolutely. We use 256-bit AES encryption, secure data centers, and follow industry best practices to keep your data safe."
          }
        ]}
      />
    </div>
  );
}
