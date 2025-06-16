import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Cloud, Lock, Zap } from "lucide-react";
import { ModeToggle } from "@/components/layout/theme-toggle";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header with Theme Toggle */}
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-end">
          <ModeToggle />
        </div>
      </div>

      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="flex flex-col items-center text-center space-y-8">
          <div className="flex items-center space-x-2">
            <Image
              src="/favicon.ico"
              alt="CloudNest Logo"
              width={48}
              height={48}
              className="rounded-lg"
            />
            <h1 className="text-4xl font-bold tracking-tight">CloudNest</h1>
          </div>
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

      {/* Free Tier Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Start with Our Free Tier</h2>
          <p className="text-muted-foreground">
            Get started with 1GB of free storage. Upgrade anytime as your needs grow.
          </p>
        </div>
        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Free Storage</CardTitle>
              <CardDescription>Everything you need to get started</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-4">$0<span className="text-lg font-normal text-muted-foreground">/month</span></div>
              <ul className="space-y-2 mb-6">
                <li className="flex items-center">
                  <span className="mr-2">✓</span> 1GB Storage
                </li>
                <li className="flex items-center">
                  <span className="mr-2">✓</span> Basic Features
                </li>
                <li className="flex items-center">
                  <span className="mr-2">✓</span> Community Support
                </li>
              </ul>
              <Link href="/sign-up">
                <Button className="w-full">Get Started</Button>
              </Link>
              <p className="text-sm text-muted-foreground text-center mt-4">
                Need more? Upgrade to Pro plan anytime for 50GB storage and premium features.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
