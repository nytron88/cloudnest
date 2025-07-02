import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbList,
    BreadcrumbPage,
} from "@/components/ui/breadcrumb";

export function BrowseLoadingSkeleton() {
    return (
        <>
            {/* Header Skeleton */}
            <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                <SidebarTrigger className="-ml-1" />
                <Separator orientation="vertical" className="mr-2 h-4" />
                <Breadcrumb>
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <BreadcrumbPage>
                                <Skeleton className="h-5 w-24" />
                            </BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
                
                <div className="ml-auto">
                    <Skeleton className="h-9 w-32" />
                </div>
            </header>

            {/* Content Area Skeleton */}
            <div className="flex flex-1 flex-col gap-4 p-4">
                {/* Search Bar Skeleton */}
                <Card>
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
                        <Card key={i} className="relative group hover:shadow-md transition-shadow">
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
        </>
    );
} 