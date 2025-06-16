import { ModeToggle } from "@/components/layout/theme-toggle";
import Link from "next/link";

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen flex flex-col">
            {/* Header */}
            <header className="border-b">
                <div className="container max-w-5xl mx-auto flex h-16 items-center justify-between px-4">
                    <Link href="/" className="hover:opacity-80 transition-opacity">
                        <div className="text-xl font-semibold">CloudNest</div>
                    </Link>
                    <ModeToggle />
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 flex items-center justify-center px-4 pb-4">
                <div className="w-full max-w-md space-y-6">
                    {children}
                </div>
            </main>
        </div>
    );
} 