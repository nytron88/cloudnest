import { Card, CardContent, CardHeader } from "@/components/ui/card";

function SkeletonBox({ className = "" }: { className?: string }) {
    return <div className={`bg-muted rounded animate-pulse ${className}`} />;
}

function StatCardSkeleton() {
    return (
        <Card className="transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
                <SkeletonBox className="h-4 w-20" />
                <SkeletonBox className="h-4 w-4 rounded flex-shrink-0" />
            </CardHeader>
            <CardContent className="px-4 pb-4">
                <SkeletonBox className="h-8 w-12 mb-2" />
                <SkeletonBox className="h-4 w-24" />
            </CardContent>
        </Card>
    );
}

function LargeCardSkeleton() {
    return (
        <Card className="transition-all duration-300">
            <CardHeader>
                <div className="flex items-center gap-2">
                    <SkeletonBox className="h-5 w-5 rounded" />
                    <SkeletonBox className="h-6 w-32" />
                </div>
                <SkeletonBox className="h-4 w-48" />
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <SkeletonBox className="h-4 w-20" />
                        <SkeletonBox className="h-4 w-24" />
                    </div>
                    <SkeletonBox className="h-3 w-full rounded-full" />
                    <div className="flex items-center justify-between">
                        <SkeletonBox className="h-4 w-16" />
                        <SkeletonBox className="h-4 w-20" />
                    </div>
                    <div className="flex items-center justify-between">
                        <SkeletonBox className="h-4 w-24" />
                        <SkeletonBox className="h-8 w-28 rounded-md" />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

function RecentContentSkeleton() {
    return (
        <Card className="mb-6 md:mb-8 transition-all duration-300">
            <CardHeader>
                <div className="flex items-center gap-2">
                    <SkeletonBox className="h-5 w-5 rounded" />
                    <SkeletonBox className="h-6 w-32" />
                </div>
                <SkeletonBox className="h-4 w-56" />
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 rounded-lg border">
                            <SkeletonBox className="h-5 w-5 rounded flex-shrink-0" />
                            <div className="flex-1 min-w-0 space-y-2">
                                <SkeletonBox className="h-4 w-32" />
                                <div className="flex items-center gap-4">
                                    <SkeletonBox className="h-3 w-16" />
                                    <SkeletonBox className="h-3 w-20" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}

function QuickActionSkeleton() {
    return (
        <Card className="border-2">
            <CardHeader>
                <div className="flex items-center gap-2">
                    <SkeletonBox className="h-5 w-5 rounded" />
                    <SkeletonBox className="h-6 w-24" />
                </div>
                <SkeletonBox className="h-4 w-40" />
            </CardHeader>
            <CardContent>
                <SkeletonBox className="h-10 w-full rounded-md" />
            </CardContent>
        </Card>
    );
}

export function DashboardLoadingSkeleton() {
    return (
        <div className="min-h-screen bg-background">
            <div className="container max-w-6xl mx-auto px-3 sm:px-4 py-6 sm:py-8">
                {/* Header Skeleton */}
                <div className="mb-6 md:mb-8">
                    <SkeletonBox className="h-6 sm:h-8 w-60 sm:w-80 mb-2" />
                    <SkeletonBox className="h-4 sm:h-5 w-72 sm:w-96" />
                </div>

                {/* Stats Cards Skeleton */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
                    {[...Array(4)].map((_, i) => (
                        <StatCardSkeleton key={i} />
                    ))}
                </div>

                {/* Two Column Layout Skeleton */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 md:mb-8">
                    <LargeCardSkeleton />
                    <LargeCardSkeleton />
                </div>

                {/* Recent Content Skeleton */}
                <RecentContentSkeleton />

                {/* Quick Actions Skeleton */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[...Array(3)].map((_, i) => (
                        <QuickActionSkeleton key={i} />
                    ))}
                </div>
            </div>
        </div>
    );
} 