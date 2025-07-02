'use client';

import { ClientNav } from "@/components/layout/client-nav";
import { usePathname } from "next/navigation";

export default function AppLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isBrowsePage = pathname?.startsWith('/browse');

    return (
        <div className="min-h-screen bg-background">
            {!isBrowsePage && (
                <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
                    <ClientNav />
                </header>
            )}

            {isBrowsePage ? (
                <div className="h-screen">
                    {children}
                </div>
            ) : (
                <div className="container max-w-6xl mx-auto px-4 py-8">
                    {children}
                </div>
            )}
        </div>
    );
}
