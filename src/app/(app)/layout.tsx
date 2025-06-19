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
            <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
                <div className="container max-w-6xl mx-auto flex h-16 items-center justify-between px-4">
                    {/* Logo Section */}
                    <div className="flex items-center space-x-3">
                        <Link href="/dashboard" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
                            <Image
                                src="/favicon.ico"
                                alt="CloudNest"
                                width={48}
                                height={48}
                                className="object-contain"
                            />
                            <h1 className="text-xl font-bold tracking-tight">CloudNest</h1>
                        </Link>
                    </div>

                    {/* Navigation & Actions */}
                    <div className="flex items-center space-x-6">
                        <nav className="hidden sm:flex">
                            <Link
                                href="/subscription"
                                className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent hover:rounded-md transition-all duration-200"
                            >
                                Manage Subscription
                            </Link>
                        </nav>

                        <div className="flex items-center space-x-3 border-l pl-6">
                            <ModeToggle />
                            <UserButton
                                afterSignOutUrl="/"
                                appearance={{
                                    elements: {
                                        avatarBox: "w-8 h-8"
                                    }
                                }}
                            />
                        </div>
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
