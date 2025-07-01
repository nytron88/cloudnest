import { Card, CardContent, CardHeader } from "@/components/ui/card";

function SkeletonBox({ className = "" }: { className?: string }) {
    return <div className={`bg-muted rounded animate-pulse ${className}`} />;
}

export function PricingCardLoader({ isPopular = false, showFeatures = true }: {
    isPopular?: boolean;
    showFeatures?: boolean;
}) {
    return (
        <Card className="relative border-2 w-full max-w-sm justify-self-center h-[380px] flex flex-col bg-gradient-to-b from-background to-muted/20">
            {isPopular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <SkeletonBox className="h-6 w-24 rounded-full" />
                </div>
            )}
            <CardHeader className="text-center pb-2 h-[100px] flex flex-col justify-center pt-4">
                <SkeletonBox className="h-7 w-20 mx-auto mb-2" />
                <div className="py-2">
                    <SkeletonBox className="h-10 w-32 mx-auto mb-1" />
                    <SkeletonBox className="h-4 w-16 mx-auto" />
                </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col px-6 pb-6">
                {showFeatures && (
                    <ul className="space-y-3 flex-1">
                        <li className="flex items-center gap-2">
                            <SkeletonBox className="h-4 w-4 rounded flex-shrink-0" />
                            <SkeletonBox className="h-4 w-24" />
                        </li>
                        <li className="flex items-center gap-2">
                            <SkeletonBox className="h-4 w-4 rounded flex-shrink-0" />
                            <SkeletonBox className="h-4 w-32" />
                        </li>
                        <li className="flex items-center gap-2">
                            <SkeletonBox className="h-4 w-4 rounded flex-shrink-0" />
                            <SkeletonBox className="h-4 w-28" />
                        </li>
                    </ul>
                )}
                <div className="mt-4">
                    <SkeletonBox className="h-10 w-full rounded-md" />
                </div>
            </CardContent>
        </Card>
    );
}

export function PricingToggleLoader() {
    return (
        <div className="text-center mb-12">
            <SkeletonBox className="h-8 w-48 mx-auto mb-4" />
            <SkeletonBox className="h-5 w-96 mx-auto mb-8" />

            {/* Billing Toggle */}
            <div className="inline-flex items-center bg-muted rounded-lg p-1 mb-8">
                <SkeletonBox className="h-10 w-24 rounded-md" />
                <SkeletonBox className="h-10 w-32 rounded-md ml-1" />
            </div>
        </div>
    );
}

export function PricingSectionLoader({
    showToggle = true,
    cardCount = 3,
    containerClassName = "container mx-auto px-4 py-16"
}: {
    showToggle?: boolean;
    cardCount?: number;
    containerClassName?: string;
}) {
    return (
        <div className={containerClassName}>
            {showToggle && <PricingToggleLoader />}

            {/* Pricing Cards Grid */}
            <div className={`grid gap-6 lg:gap-8 mx-auto justify-center ${cardCount === 1
                    ? "grid-cols-1 max-w-sm"
                    : cardCount === 2
                        ? "grid-cols-1 md:grid-cols-2 max-w-2xl"
                        : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 max-w-4xl"
                }`}>
                {[...Array(cardCount)].map((_, i) => (
                    <PricingCardLoader
                        key={i}
                        isPopular={i === 1 && cardCount > 1}
                    />
                ))}
            </div>
        </div>
    );
}

export function FeatureCardLoader() {
    return (
        <Card className="text-center border-0 shadow-md hover:shadow-lg transition-all duration-300">
            <CardHeader className="pb-6">
                <div className="mx-auto mb-4 p-3 bg-muted rounded-full w-fit">
                    <SkeletonBox className="h-6 w-6" />
                </div>
                <SkeletonBox className="h-6 w-32 mx-auto mb-2" />
                <SkeletonBox className="h-4 w-40 mx-auto" />
                <SkeletonBox className="h-4 w-36 mx-auto" />
            </CardHeader>
        </Card>
    );
}

export function FeaturesGridLoader({
    cardCount = 4,
    containerClassName = "container mx-auto px-4 py-16"
}: {
    cardCount?: number;
    containerClassName?: string;
}) {
    return (
        <div className={containerClassName}>
            <div className="text-center mb-12">
                <SkeletonBox className="h-8 w-48 mx-auto mb-4" />
                <SkeletonBox className="h-5 w-80 mx-auto" />
                <SkeletonBox className="h-5 w-64 mx-auto" />
            </div>

            <div className={`grid gap-6 max-w-6xl mx-auto ${cardCount === 1
                    ? "grid-cols-1"
                    : cardCount === 2
                        ? "grid-cols-1 md:grid-cols-2"
                        : cardCount === 3
                            ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
                            : "grid-cols-1 md:grid-cols-2 lg:grid-cols-4"
                }`}>
                {[...Array(cardCount)].map((_, i) => (
                    <FeatureCardLoader key={i} />
                ))}
            </div>
        </div>
    );
}

export function CompactPricingLoader({ cardCount = 2 }: { cardCount?: number }) {
    return (
        <div className="py-8">
            <div className="text-center mb-6">
                <SkeletonBox className="h-6 w-32 mx-auto mb-2" />
                <SkeletonBox className="h-4 w-48 mx-auto" />
            </div>

            <div className={`grid gap-4 mx-auto justify-center ${cardCount === 1
                    ? "grid-cols-1 max-w-xs"
                    : "grid-cols-1 sm:grid-cols-2 max-w-2xl"
                }`}>
                {[...Array(cardCount)].map((_, i) => (
                    <div key={i} className="bg-muted/50 rounded-lg p-4">
                        <SkeletonBox className="h-5 w-16 mb-2" />
                        <SkeletonBox className="h-8 w-24 mb-3" />
                        <SkeletonBox className="h-4 w-20 mb-3" />
                        <SkeletonBox className="h-9 w-full rounded-md" />
                    </div>
                ))}
            </div>
        </div>
    );
} 