"use client";

import { 
    Files, 
    Clock, 
    Star, 
    Trash2, 
    HardDrive,
    ChevronDown,
    Settings,
    CreditCard,
    LayoutDashboard
} from "lucide-react";
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarSeparator,
} from "@/components/ui/sidebar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import { CloudNestLogo } from "@/components/icons";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import axios from "axios";
import { APIResponse } from "@/types/apiResponse";
import { StripeCreatePortalSessionResponse } from "@/types/stripe";

interface BrowseSidebarProps {
    currentView: 'all' | 'recent' | 'starred' | 'trash';
    onViewChange: (view: 'all' | 'recent' | 'starred' | 'trash') => void;
    storageUsed?: number;
    storageLimit?: number;
}

const navigationItems = [
    { id: 'all' as const, label: 'All Files', icon: Files },
    { id: 'recent' as const, label: 'Recent', icon: Clock },
];

const libraryItems = [
    { id: 'starred' as const, label: 'Starred', icon: Star },
    { id: 'trash' as const, label: 'Trash', icon: Trash2 },
];

export function BrowseSidebar({ 
    currentView, 
    onViewChange, 
    storageUsed = 0, 
    storageLimit = 1024 * 1024 * 1024 // 1GB in bytes
}: BrowseSidebarProps) {
    const router = useRouter();

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const storagePercentage = (storageUsed / storageLimit) * 100;

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

    return (
        <Sidebar variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <SidebarMenuButton size="lg" className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground cursor-pointer">
                                    <div className="flex aspect-square size-12 items-center justify-center rounded-lg">
                                        <CloudNestLogo size={54} />
                                    </div>
                                    <div className="grid flex-1 text-left text-sm leading-tight">
                                        <span className="truncate font-semibold">CloudNest</span>
                                        <span className="truncate text-xs">File Storage</span>
                                    </div>
                                    <ChevronDown className="ml-auto size-4" />
                                </SidebarMenuButton>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" side="bottom" className="w-56">
                                <DropdownMenuItem onClick={() => router.push('/dashboard')} className="cursor-pointer">
                                    <LayoutDashboard className="mr-2 h-4 w-4" />
                                    Dashboard
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => router.push('/pricing')} className="cursor-pointer">
                                    <CreditCard className="mr-2 h-4 w-4" />
                                    Pricing
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={handleManageSubscription} className="cursor-pointer">
                                    <Settings className="mr-2 h-4 w-4" />
                                    Manage Subscription
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                {/* Files Section */}
                <SidebarGroup>
                    <SidebarGroupLabel>Files</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {navigationItems.map((item) => {
                                const Icon = item.icon;
                                const isActive = currentView === item.id;
                                
                                return (
                                    <SidebarMenuItem key={item.id}>
                                        <SidebarMenuButton 
                                            onClick={() => onViewChange(item.id)}
                                            isActive={isActive}
                                            className="cursor-pointer"
                                        >
                                            <Icon className="size-4" />
                                            <span>{item.label}</span>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                );
                            })}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>

                {/* Library Section */}
                <SidebarGroup>
                    <SidebarGroupLabel>Library</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {libraryItems.map((item) => {
                                const Icon = item.icon;
                                const isActive = currentView === item.id;
                                
                                return (
                                    <SidebarMenuItem key={item.id}>
                                        <SidebarMenuButton 
                                            onClick={() => onViewChange(item.id)}
                                            isActive={isActive}
                                            className="cursor-pointer"
                                        >
                                            <Icon className="size-4" />
                                            <span>{item.label}</span>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                );
                            })}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>

            <SidebarFooter>
                <SidebarGroup>
                    <SidebarGroupLabel className="flex items-center gap-2">
                        <HardDrive className="size-4" />
                        Storage
                    </SidebarGroupLabel>
                    <SidebarGroupContent>
                        <div className="px-2 py-1">
                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-muted-foreground">Used</span>
                                    <span className="font-medium">
                                        {formatBytes(storageUsed)}
                                    </span>
                                </div>
                                <Progress 
                                    value={Math.min(storagePercentage, 100)} 
                                    className="h-2"
                                />
                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                    <span>{storagePercentage.toFixed(1)}% used</span>
                                    <span>{formatBytes(storageLimit)} total</span>
                                </div>
                            </div>
                        </div>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarFooter>
        </Sidebar>
    );
} 