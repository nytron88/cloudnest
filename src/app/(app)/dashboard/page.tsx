'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import axios from 'axios';
import { UserProfileResponseData } from '@/types/user';
import { CombinedContentItem } from '@/types/folder';
import { PaginatedResponse } from '@/types/pagination';
import { useUser } from '@clerk/nextjs';
import { toast } from 'sonner';
import { APIResponse } from '@/types/apiResponse';
import { StripeCreatePortalSessionResponse } from '@/types/stripe';

import {
    DashboardStats,
    StorageUsageCard,
    AccountInfoCard,
    RecentContentCard,
    DashboardQuickActions,
    DashboardLoadingSkeleton
} from '@/components/dashboard';

interface DashboardData {
    userProfile: UserProfileResponseData | null;
    recentContent: CombinedContentItem[];
    loading: boolean;
    error: string | null;
}

export default function DashboardPage() {
    const { user, isLoaded: userLoaded } = useUser();
    const [data, setData] = useState<DashboardData>({
        userProfile: null,
        recentContent: [],
        loading: true,
        error: null
    });

    const handleManageSubscription = async () => {
        try {
            const res = await axios.post<APIResponse<StripeCreatePortalSessionResponse>>(
                "/api/stripe/create-portal-session"
            );

            if (res.data?.payload?.url) {
                window.location.href = res.data.payload.url;
            } else {
                toast.error("Failed to create portal session", {
                    description: "Please try again later",
                });
            }
        } catch (err: any) {
            toast.error("Error creating portal session", {
                description:
                    err.response?.data?.message || "Please check your connection and try again",
            });
        }
    };

    useEffect(() => {
        const fetchDashboardData = async () => {
            if (!userLoaded) return;

            try {
                setData(prev => ({ ...prev, loading: true, error: null }));

                // Fetch user profile and recent content in parallel
                const [userResponse, contentResponse] = await Promise.all([
                    axios.get<{ payload: UserProfileResponseData }>('/api/user/me'),
                    axios.get<{ payload: PaginatedResponse<CombinedContentItem> }>('/api/recent-content?pageSize=6&sortBy=updatedAt&order=desc')
                ]);

                setData({
                    userProfile: userResponse.data.payload,
                    recentContent: contentResponse.data.payload.data,
                    loading: false,
                    error: null
                });
            } catch (error) {
                console.error('Failed to fetch dashboard data:', error);
                setData(prev => ({
                    ...prev,
                    loading: false,
                    error: 'Failed to load dashboard data. Please refresh the page.'
                }));
            }
        };

        fetchDashboardData();
    }, [userLoaded]);

    if (!userLoaded || data.loading) {
        return <DashboardLoadingSkeleton />;
    }

    if (data.error) {
        return (
            <div className="min-h-screen bg-background">
                <div className="container max-w-6xl mx-auto px-3 sm:px-4 py-6 sm:py-8">
                    <Card>
                        <CardContent className="pt-6">
                            <div className="text-center">
                                <p className="text-destructive mb-4">{data.error}</p>
                                <Button onClick={() => window.location.reload()}>
                                    Retry
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    const { userProfile, recentContent } = data;
    const currentPlan = userProfile?.subscription?.plan || 'FREE';
    const userName = user?.fullName || user?.firstName || user?.emailAddresses?.[0]?.emailAddress?.split('@')[0] || 'User';

    return (
        <div className="min-h-screen bg-background">
            {/* Main Content */}
            <div className="container max-w-6xl mx-auto px-3 sm:px-4 py-6 sm:py-8">
                <div className="mb-6 md:mb-8">
                    <h2 className="text-2xl sm:text-3xl font-bold mb-2">Welcome back, {userName}!</h2>
                    <p className="text-sm sm:text-base text-muted-foreground">
                        Here's an overview of your CloudNest account and recent activity.
                    </p>
                </div>

                {/* Dashboard Stats */}
                <DashboardStats userProfile={userProfile} />

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 md:mb-8">
                    {/* Storage Usage */}
                    <StorageUsageCard
                        userProfile={userProfile}
                        onManageSubscription={handleManageSubscription}
                    />

                    {/* Account Info */}
                    <AccountInfoCard
                        userProfile={userProfile}
                        userName={userName}
                    />
                </div>

                {/* Recent Content */}
                <RecentContentCard recentContent={recentContent} />

                {/* Quick Actions */}
                <DashboardQuickActions
                    currentPlan={currentPlan}
                    onManageSubscription={handleManageSubscription}
                />
            </div>
        </div>
    );
}