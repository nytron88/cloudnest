import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Cloud, Lock, Zap } from "lucide-react";
import { ModeToggle } from "@/components/layout/theme-toggle";
import { getSubscriptionPlans } from "@/lib/actions/getSubscriptionPlans.server";
import { PricingSection } from "@/components/landing-page/pricing-section";

export const revalidate = 3600;

export default async function Home() {
  const subscriptionPlans = await getSubscriptionPlans();

  return (
    <div className="min-h-screen bg-background">
      {/* Header with Logo and Theme Toggle */}
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <Image
            src="/favicon.ico"
            alt="CloudNest Logo"
            width={54}
            height={54}
            className="rounded-lg object-contain"
          />
          <ModeToggle />
        </div>
      </div>

      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="flex flex-col items-center text-center space-y-8">
          <h1 className="text-4xl font-bold tracking-tight">CloudNest</h1>
          <p className="text-xl text-muted-foreground max-w-2xl">
            Your secure cloud storage solution. Store, access, and share your files with ease.
          </p>
          <div className="flex gap-4">
            <Link href="/sign-up">
              <Button size="lg" className="gap-2">
                Get Started <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/sign-in">
              <Button size="lg" variant="outline">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card>
            <CardHeader>
              <Cloud className="h-8 w-8 mb-4 text-primary" />
              <CardTitle>Cloud Storage</CardTitle>
              <CardDescription>
                Store your files securely in the cloud with our advanced storage system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Get started with free storage and upgrade as you grow
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Lock className="h-8 w-8 mb-4 text-primary" />
              <CardTitle>Secure & Private</CardTitle>
              <CardDescription>
                Your data is encrypted and protected with enterprise-grade security
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                End-to-end encryption ensures your files stay private
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Zap className="h-8 w-8 mb-4 text-primary" />
              <CardTitle>Lightning Fast</CardTitle>
              <CardDescription>
                Access your files instantly with our optimized delivery network
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Fast upload and download speeds for all your files
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Pricing Section */}
      <PricingSection plans={subscriptionPlans} />
    </div>
  );
}
