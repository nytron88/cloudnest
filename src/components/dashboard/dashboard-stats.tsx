import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Folder, Link, HardDrive } from "lucide-react";
import { UserProfileResponseData } from '@/types/user';
import { formatFileSize, getPlanLimit } from '@/lib/utils/dashboard-helpers';

interface DashboardStatsProps {
    userProfile: UserProfileResponseData | null;
}

export function DashboardStats({ userProfile }: DashboardStatsProps) {
    const currentPlan = userProfile?.subscription?.plan || 'FREE';
    const planLimit = getPlanLimit(currentPlan);

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
            <Card className="transition-all duration-300 hover:shadow-md">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
                    <CardTitle className="text-sm font-medium truncate">Total Files</CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                </CardHeader>
                <CardContent className="px-4 pb-4">
                    <div className="text-2xl font-bold">{userProfile?.totalFiles || 0}</div>
                    <p className="text-sm text-muted-foreground">Files uploaded</p>
                </CardContent>
            </Card>

            <Card className="transition-all duration-300 hover:shadow-md">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
                    <CardTitle className="text-sm font-medium truncate">Total Folders</CardTitle>
                    <Folder className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                </CardHeader>
                <CardContent className="px-4 pb-4">
                    <div className="text-2xl font-bold">{userProfile?.totalFolders || 0}</div>
                    <p className="text-sm text-muted-foreground">Folders created</p>
                </CardContent>
            </Card>

            <Card className="transition-all duration-300 hover:shadow-md">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
                    <CardTitle className="text-sm font-medium truncate">Shared Links</CardTitle>
                    <Link className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                </CardHeader>
                <CardContent className="px-4 pb-4">
                    <div className="text-2xl font-bold">{userProfile?.totalSharedLinks || 0}</div>
                    <p className="text-sm text-muted-foreground">Active shares</p>
                </CardContent>
            </Card>

            <Card className="transition-all duration-300 hover:shadow-md">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
                    <CardTitle className="text-sm font-medium truncate">Storage Used</CardTitle>
                    <HardDrive className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                </CardHeader>
                <CardContent className="px-4 pb-4">
                    <div className="text-2xl font-bold">{formatFileSize(userProfile?.usedStorage || 0)}</div>
                    <p className="text-sm text-muted-foreground">of {planLimit}</p>
                </CardContent>
            </Card>
        </div>
    );
} 