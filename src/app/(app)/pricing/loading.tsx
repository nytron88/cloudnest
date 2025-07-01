import {
    PricingSectionLoader,
    FeaturesGridLoader
} from "@/components/pricing";

function SkeletonBox({ className = "" }: { className?: string }) {
    return <div className={`bg-muted rounded animate-pulse ${className}`} />;
}

function PricingHeaderSkeleton() {
    return (
        <div className="border-b bg-muted/20">
            <div className="container mx-auto px-4 py-12">
                <div className="text-center space-y-4">
                    <SkeletonBox className="h-10 w-80 mx-auto" />
                    <SkeletonBox className="h-6 w-96 mx-auto" />
                    <SkeletonBox className="h-6 w-72 mx-auto" />
                </div>
            </div>
        </div>
    );
}

function FAQItemSkeleton() {
    return (
        <div className="border-b border-border/40 py-4">
            <SkeletonBox className="h-6 w-80 mb-3" />
            <SkeletonBox className="h-4 w-full mb-2" />
            <SkeletonBox className="h-4 w-96" />
            <SkeletonBox className="h-4 w-64" />
        </div>
    );
}

function FAQSectionSkeleton() {
    return (
        <div className="bg-muted/50">
            <div className="container mx-auto px-4 py-16">
                <div className="text-center mb-12">
                    <SkeletonBox className="h-8 w-60 mx-auto mb-4" />
                    <SkeletonBox className="h-5 w-80 mx-auto" />
                </div>

                <div className="max-w-3xl mx-auto">
                    {[...Array(4)].map((_, i) => (
                        <FAQItemSkeleton key={i} />
                    ))}
                </div>
            </div>
        </div>
    );
}

export default function PricingLoading() {
    return (
        <div className="min-h-screen bg-background">
            <PricingHeaderSkeleton />

            <PricingSectionLoader cardCount={3} />

            <FeaturesGridLoader cardCount={4} />

            <FAQSectionSkeleton />
        </div>
    );
} 