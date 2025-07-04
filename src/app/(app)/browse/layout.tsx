'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useUser } from '@clerk/nextjs';
import axios from 'axios';
import { BrowseSidebar } from '@/components/browse';
import {
    SidebarProvider,
    SidebarInset,
} from "@/components/ui/sidebar";
import { UserProfileResponseData } from '@/types/user';
import { APIResponse } from '@/types/apiResponse';
import { getStorageLimit } from '@/lib/utils/dashboard-helpers';

type ViewType = 'all' | 'recent' | 'starred' | 'trash';

interface BrowseContextType {
    currentView: ViewType;
    setCurrentView: (view: ViewType) => void;
    userProfile: UserProfileResponseData | null;
}

const BrowseContext = createContext<BrowseContextType | undefined>(undefined);

export function useBrowseContext() {
    const context = useContext(BrowseContext);
    if (!context) {
        throw new Error('useBrowseContext must be used within BrowseLayout');
    }
    return context;
}

export default function BrowseLayout({ children }: { children: ReactNode }) {
    const { isLoaded: userLoaded } = useUser();
    const [currentView, setCurrentView] = useState<ViewType>('all');
    const [userProfile, setUserProfile] = useState<UserProfileResponseData | null>(null);

    // Initialize view from localStorage on mount
    useEffect(() => {
        try {
            const savedView = localStorage.getItem('cloudnest-browse-view');
            if (savedView && ['all', 'recent', 'starred', 'trash'].includes(savedView)) {
                setCurrentView(savedView as ViewType);
            }
        } catch (error) {
            // localStorage might not be available in some environments
            console.warn('Failed to load browse view from localStorage:', error);
        }
    }, []);

    // Save view to localStorage whenever it changes
    const handleViewChange = (view: ViewType) => {
        setCurrentView(view);
        try {
            localStorage.setItem('cloudnest-browse-view', view);
        } catch (error) {
            // localStorage might not be available in some environments
            console.warn('Failed to save browse view to localStorage:', error);
        }
    };

    useEffect(() => {
        const fetchUserProfile = async () => {
            if (!userLoaded) return;
            
            try {
                const response = await axios.get<APIResponse<UserProfileResponseData>>('/api/user/me');
                if (response.data.success) {
                    setUserProfile(response.data.payload || null);
                }
            } catch (error) {
                console.error('Failed to fetch user profile:', error);
            }
        };

        fetchUserProfile();
    }, [userLoaded]);

    return (
        <BrowseContext.Provider value={{ currentView, setCurrentView: handleViewChange, userProfile }}>
            <SidebarProvider>
                <div className="flex h-screen w-full">
                    <BrowseSidebar 
                        currentView={currentView}
                        onViewChange={handleViewChange}
                        storageUsed={userProfile?.usedStorage || 0}
                        storageLimit={getStorageLimit(userProfile?.subscription?.plan || null)}
                    />
                    <SidebarInset className="flex-1">
                        <div className="flex flex-1 flex-col overflow-hidden">
                            {children}
                        </div>
                    </SidebarInset>
                </div>
            </SidebarProvider>
        </BrowseContext.Provider>
    );
} 