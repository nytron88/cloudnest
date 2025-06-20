"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FileQuestion } from "lucide-react";

export default function NotFoundComponent() {
    return (
        <div className="container max-w-md px-4 py-16 text-center">
            <div className="flex flex-col items-center space-y-6">
                <div className="rounded-full bg-primary/10 p-4">
                    <FileQuestion className="h-12 w-12 text-primary" />
                </div>
                <div className="space-y-2">
                    <h1 className="text-3xl font-bold tracking-tight">Page Not Found</h1>
                    <p className="text-muted-foreground">
                        The page you're looking for doesn't exist or has been moved.
                    </p>
                </div>
                <div className="flex gap-4">
                    <Link href={"/"}>
                        <Button>Go Home</Button>
                    </Link>
                    <Button variant="outline" onClick={() => window.history.back()}>
                        Go Back
                    </Button>
                </div>
            </div>
        </div>
    )
}