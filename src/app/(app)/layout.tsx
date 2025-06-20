import { ClientNav } from "@/components/layout/client-nav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen bg-background">
            <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
                <ClientNav />
            </header>

            <div className="container max-w-6xl mx-auto px-4 py-8">
                {children}
            </div>
        </div>
    );
}
