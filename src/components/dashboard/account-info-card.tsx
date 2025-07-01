import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Crown } from "lucide-react";
import { UserProfileResponseData } from '@/types/user';
import { formatPlanName, formatFileSize } from '@/lib/utils/dashboard-helpers';
import { PRO_MAX_STORAGE_BYTES, PRO_MAX_FILE_SIZE_BYTES } from '@/lib/utils/constants';

interface AccountInfoCardProps {
    userProfile: UserProfileResponseData | null;
    userName: string;
}

export function AccountInfoCard({ userProfile, userName }: AccountInfoCardProps) {
    const currentPlan = userProfile?.subscription?.plan || 'FREE';

    return (
        <Card className="transition-all duration-300 hover:shadow-md">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Account Information
                </CardTitle>
                <CardDescription>
                    Your account details and subscription status
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Name</span>
                        <span className="text-sm font-medium">{userName}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Email</span>
                        <span className="text-sm font-medium">{userProfile?.email}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Plan</span>
                        <div className="flex items-center gap-2">
                            {currentPlan !== 'FREE' && (
                                <Crown className="h-4 w-4 text-amber-500" />
                            )}
                            <span className="text-sm font-medium">
                                {formatPlanName(currentPlan)}
                            </span>
                        </div>
                    </div>
                    {userProfile?.subscription && (
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Status</span>
                            <span className="text-sm font-medium capitalize">
                                {userProfile.subscription.status}
                            </span>
                        </div>
                    )}
                    {currentPlan !== 'FREE' && (
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>Benefits</span>
                            <span>{formatFileSize(PRO_MAX_STORAGE_BYTES)} storage • {formatFileSize(PRO_MAX_FILE_SIZE_BYTES)} uploads</span>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
} 