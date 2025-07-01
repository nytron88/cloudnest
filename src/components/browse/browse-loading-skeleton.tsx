import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function BrowseLoadingSkeleton() {
    return (
        <div className="min-h-screen bg-background">
            <div className="container max-w-7xl mx-auto px-3 sm:px-4 py-6 sm:py-8">
                {/* Header Skeleton */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <Skeleton className="h-8 w-40 mb-2" />
                        <Skeleton className="h-4 w-60" />
                    </div>
                    <div className="flex items-center gap-2">
                        <Skeleton className="h-9 w-20" />
                        <Skeleton className="h-9 w-16" />
                        <Skeleton className="h-9 w-20" />
                    </div>
                </div>

                {/* Breadcrumb Skeleton */}
                <div className="flex items-center gap-2 mb-4">
                    <Skeleton className="h-6 w-12" />
                    <Skeleton className="h-4 w-4" />
                    <Skeleton className="h-6 w-20" />
                </div>

                {/* Search Bar Skeleton */}
                <Card className="mb-6">
                    <CardContent className="p-4">
                        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                            <Skeleton className="h-10 w-full max-w-md" />
                            <div className="flex items-center gap-2">
                                <Skeleton className="h-8 w-16" />
                                <Skeleton className="h-8 w-24" />
                                <Skeleton className="h-8 w-16" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Content Stats Skeleton */}
                <div className="flex items-center justify-between mb-4">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-5 w-20" />
                </div>

                {/* File Grid Skeleton */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                    {Array.from({ length: 24 }).map((_, i) => (
                        <Card key={i} className="relative">
                            <CardContent className="p-4">
                                <div className="mb-3 flex items-center justify-center h-24">
                                    <Skeleton className="w-16 h-16 rounded" />
                                </div>
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-full" />
                                    <Skeleton className="h-3 w-16" />
                                    <Skeleton className="h-3 w-20" />
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Pagination Skeleton */}
                <div className="flex items-center justify-between mt-8">
                    <Skeleton className="h-9 w-24" />
                    <div className="flex items-center gap-2">
                        <Skeleton className="h-9 w-9" />
                        <Skeleton className="h-9 w-9" />
                        <Skeleton className="h-9 w-9" />
                        <Skeleton className="h-9 w-9" />
                    </div>
                    <Skeleton className="h-9 w-24" />
                </div>
            </div>
        </div>
    );
} 