import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, FolderOpen, Crown } from "lucide-react";
import { UploadDialog } from "@/components/upload";

interface DashboardQuickActionsProps {
    currentPlan: string;
    onManageSubscription: () => void;
}

export function DashboardQuickActions({
    currentPlan,
    onManageSubscription
}: DashboardQuickActionsProps) {
    const userPlan = currentPlan as 'FREE' | 'PRO_MONTHLY' | 'PRO_YEARLY';

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Upload Files */}
            <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                    <div className="flex flex-col items-center text-center space-y-4">
                        <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-full">
                            <Upload className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <h3 className="font-semibold mb-1">Upload Files</h3>
                            <p className="text-sm text-muted-foreground mb-4">
                                Add new files to your storage
                            </p>
                        </div>
                        <UploadDialog
                            userPlan={userPlan}
                            trigger={
                                <Button className="w-full">
                                    Upload Now
                                </Button>
                            }
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Browse Files */}
            <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                    <div className="flex flex-col items-center text-center space-y-4">
                        <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-full">
                            <FolderOpen className="h-6 w-6 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                            <h3 className="font-semibold mb-1">Browse Files</h3>
                            <p className="text-sm text-muted-foreground mb-4">
                                Explore and manage your files
                            </p>
                        </div>
                        <Button className="w-full" asChild>
                            <a href="/browse">Open File Manager</a>
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Manage Subscription */}
            <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                    <div className="flex flex-col items-center text-center space-y-4">
                        <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-full">
                            <Crown className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                            <h3 className="font-semibold mb-1">Subscription</h3>
                            <p className="text-sm text-muted-foreground mb-4">
                                Manage your plan and billing
                            </p>
                        </div>
                        <Button
                            className="w-full"
                            onClick={onManageSubscription}
                        >
                            Manage Plan
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
} 