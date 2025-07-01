import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, FileText, Crown } from "lucide-react";
import { getUploadLimit } from '@/lib/utils/dashboard-helpers';

interface DashboardQuickActionsProps {
    currentPlan: string;
    onManageSubscription: () => void;
}

export function DashboardQuickActions({ currentPlan, onManageSubscription }: DashboardQuickActionsProps) {
    const uploadLimit = getUploadLimit(currentPlan);

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer hover:scale-105 border-2 hover:border-primary/20">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 group-hover:text-primary transition-colors">
                        <Upload className="h-5 w-5" />
                        Upload Files
                    </CardTitle>
                    <CardDescription>
                        Upload up to {uploadLimit} per file
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Button className="w-full transition-all duration-200 hover:scale-105">
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Files
                    </Button>
                </CardContent>
            </Card>

            <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer hover:scale-105 border-2 hover:border-primary/20">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 group-hover:text-primary transition-colors">
                        <FileText className="h-5 w-5" />
                        Browse Files
                    </CardTitle>
                    <CardDescription>
                        Browse and organize your uploaded files
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Button variant="outline" className="w-full transition-all duration-200 hover:scale-105">
                        <FileText className="h-4 w-4 mr-2" />
                        Browse Files
                    </Button>
                </CardContent>
            </Card>

            <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer hover:scale-105 border-2 hover:border-primary/20">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 group-hover:text-primary transition-colors">
                        <Crown className="h-5 w-5" />
                        Subscription
                    </CardTitle>
                    <CardDescription>
                        {currentPlan === 'FREE' ? 'Upgrade to Pro for 1TB storage' : 'Manage your subscription and billing'}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Button 
                        variant="outline" 
                        className="w-full transition-all duration-200 hover:scale-105"
                        onClick={onManageSubscription}
                    >
                        <Crown className="h-4 w-4 mr-2" />
                        {currentPlan === 'FREE' ? 'Upgrade to Pro' : 'Manage Subscription'}
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
} 