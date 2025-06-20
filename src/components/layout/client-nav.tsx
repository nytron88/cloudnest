"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "./theme-toggle";
import { UserButton } from "@clerk/nextjs";
import { toast } from "sonner";
import axios from "axios";
import { APIResponse } from "@/types/apiResponse";
import { StripeCreatePortalSessionResponse } from "@/types/stripe";
import { useRouter } from "next/navigation";

export function ClientNav() {
    const router = useRouter();

    const handleManageSubscription = async () => {
        try {
            const res = await axios.post<APIResponse<StripeCreatePortalSessionResponse>>(
                "/api/stripe/create-portal-session"
            );

            if (res.data?.payload?.url) {
                window.location.href = res.data.payload.url;
            } else {
                toast.error("Failed to create portal session", {
                    description: "Please try again later",
                });
            }
        } catch (err: any) {
            toast.error("Error creating portal session", {
                description:
                    err.response?.data?.message || "Please check your connection and try again",
            });
        }
    };

    return (
        <div className="container max-w-6xl mx-auto flex h-16 items-center justify-between px-4">
            {/* Logo */}
            <div className="flex items-center space-x-3">
                <Link href="/dashboard" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
                    <Image src="/favicon.ico" alt="CloudNest" width={54} height={54} className="object-contain" />
                    <h1 className="text-xl font-bold tracking-tight">CloudNest</h1>
                </Link>
            </div>

            {/* Navigation */}
            <div className="flex items-center space-x-6">
                <nav className="hidden sm:flex items-center space-x-4">
                    <Button
                        variant="outline"
                        className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent hover:rounded-md transition-all duration-200"
                        onClick={() => router.push("/pricing")}
                    >
                        Pricing
                    </Button>
                    <Button
                        variant="outline"
                        className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent hover:rounded-md transition-all duration-200"
                        onClick={handleManageSubscription}
                    >
                        Manage Subscription
                    </Button>
                </nav>

                <div className="flex items-center space-x-3 border-l pl-6">
                    <ModeToggle />
                    <UserButton appearance={{ elements: { avatarBox: "w-8 h-8" } }} />
                </div>
            </div>
        </div>
    );
}
