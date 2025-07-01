import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { HardDrive, Crown } from "lucide-react";
import { UserProfileResponseData } from '@/types/user';
import { 
    formatFileSize, 
    formatDate, 
    formatPlanName, 
    getStorageUsagePercentage, 
    getPlanLimit, 
    getUploadLimit 
} from '@/lib/utils/dashboard-helpers';

interface StorageUsageCardProps {
    userProfile: UserProfileResponseData | null;
    onManageSubscription: () => void;
}

export function StorageUsageCard({ userProfile, onManageSubscription }: StorageUsageCardProps) {
    const currentPlan = userProfile?.subscription?.plan || 'FREE';
    const storageUsagePercentage = userProfile ? getStorageUsagePercentage(userProfile.usedStorage, currentPlan) : 0;
    const planLimit = getPlanLimit(currentPlan);
    const uploadLimit = getUploadLimit(currentPlan);

    return (
        <Card className="transition-all duration-300 hover:shadow-md">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <HardDrive className="h-5 w-5" />
                    Storage & Limits
                </CardTitle>
                <CardDescription>
                    Monitor your storage usage and plan limits
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Storage Used</span>
                        <span className="text-sm font-medium">
                            {formatFileSize(userProfile?.usedStorage || 0)} of {planLimit}
                        </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-3">
                        <div 
                            className="bg-primary h-3 rounded-full transition-all duration-500 ease-out" 
                            style={{ width: `${Math.min(storageUsagePercentage, 100)}%` }}
                        />
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Max Upload Size</span>
                        <span className="text-sm font-medium">{uploadLimit}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            {currentPlan !== 'FREE' && (
                                <Crown className="h-4 w-4 text-amber-500" />
                            )}
                            <span className="text-sm text-muted-foreground">
                                {formatPlanName(currentPlan)} Plan
                            </span>
                        </div>
                        <Button 
                            variant="outline" 
                            size="sm"
                            onClick={onManageSubscription}
                            className="transition-all duration-200 hover:scale-105"
                        >
                            {currentPlan !== 'FREE' 
                                ? 'Manage Subscription' 
                                : 'Upgrade Plan'
                            }
                        </Button>
                    </div>
                    {userProfile?.subscription?.currentPeriodEnd && (
                        <p className="text-xs text-muted-foreground">
                            Next billing: {formatDate(userProfile.subscription.currentPeriodEnd)}
                        </p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
} 