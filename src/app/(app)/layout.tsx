import { UserButton } from "@clerk/nextjs";
import { ModeToggle } from "@/components/layout/theme-toggle";
import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
    title: "CloudNest",
    description: "Your personal cloud storage solution",
    icons: {
        icon: "/favicon.ico",
    },
};

export default function AppLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="border-b">
                <div className="container max-w-6xl mx-auto flex h-16 items-center justify-between px-4">
                    <div className="flex items-center space-x-3">
                        <Link href="/dashboard">
                            <div className="flex items-center justify-center">
                                <Image src="/favicon.ico" alt="CloudNest" width={60} height={60} className="object-contain mt-1" />
                                <h1 className="text-xl font-semibold">CloudNest</h1>
                            </div>
                        </Link>
                    </div>
                    <div className="flex items-center space-x-4">
                        <ModeToggle />
                        <UserButton afterSignOutUrl="/" />
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <div className="container max-w-6xl mx-auto px-4 py-8">
                {children}
            </div>
        </div>
    );
}
