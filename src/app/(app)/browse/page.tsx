'use client';

import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';
import axios from 'axios';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
    FileGrid,
    SearchBar,
    BreadcrumbNav,
    BrowseHeader,
    BrowseLoadingSkeleton,
    Pagination
} from '@/components/browse';
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbList,
    BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { CombinedContentItem } from '@/types/folder';
import { PaginatedResponse } from '@/types/pagination';
import { APIResponse } from '@/types/apiResponse';
import { useBrowseContext } from './layout';

interface BreadcrumbItem {
    id: string | null;
    name: string;
    path: string;
}

type ViewType = 'all' | 'recent' | 'starred' | 'trash';

interface BrowseState {
    items: CombinedContentItem[];
    loading: boolean;
    error: string | null;
    currentPage: number;
    totalPages: number;
    totalItems: number;
    currentFolderId: string | null;
    breadcrumbs: BreadcrumbItem[];
    searchTerm: string;
    sortBy: 'name' | 'createdAt' | 'updatedAt';
    order: 'asc' | 'desc';
    viewMode: 'grid' | 'list';
}

export default function BrowsePage() {
    const { isLoaded: userLoaded } = useUser();
    const { currentView, setCurrentView, userProfile } = useBrowseContext();
    const [state, setState] = useState<BrowseState>({
        items: [],
        loading: true,
        error: null,
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        currentFolderId: null,
        breadcrumbs: [{ id: null, name: 'Home', path: '/' }],
        searchTerm: '',
        sortBy: 'name',
        order: 'asc',
        viewMode: 'grid'
    });

    const fetchContent = useCallback(async () => {
        setState(prev => ({ ...prev, loading: true, error: null }));

        try {
            const params = new URLSearchParams({
                page: state.currentPage.toString(),
                pageSize: '24',
                sortBy: state.sortBy,
                order: state.order,
            });

            if (state.searchTerm) params.append('search', state.searchTerm);

            let endpoint: string;

            // Use the correct API endpoint for each view type
            if (currentView === 'recent') {
                // Use recent-content endpoint for recent view
                endpoint = '/api/recent-content';
                params.set('sortBy', 'updatedAt');
                params.set('order', 'desc');
            } else {
                // Use search endpoint for all other views (all, starred, trash)
                endpoint = '/api/search';
                
                if (currentView === 'starred') {
                    params.append('isStarred', 'true');
                    if (state.currentFolderId) params.append('folderId', state.currentFolderId);
                } else if (currentView === 'trash') {
                    params.append('isTrash', 'true');
                    if (state.currentFolderId) params.append('folderId', state.currentFolderId);
                } else {
                    // All files view
                    params.append('isTrash', 'false');
                    if (state.currentFolderId) params.append('folderId', state.currentFolderId);
                }
            }

            const response = await axios.get<APIResponse<PaginatedResponse<CombinedContentItem>>>(
                `${endpoint}?${params.toString()}`
            );

            if (response.data.success && response.data.payload) {
                const { data, meta } = response.data.payload;
                setState(prev => ({
                    ...prev,
                    items: data,
                    totalPages: meta.totalPages,
                    totalItems: meta.totalItems,
                    loading: false
                }));
            } else {
                setState(prev => ({
                    ...prev,
                    error: response.data.message || 'Failed to load content',
                    loading: false
                }));
            }
        } catch (error: any) {
            setState(prev => ({
                ...prev,
                error: 'Failed to load content. Please try again.',
                loading: false
            }));
        }
    }, [state.currentPage, state.currentFolderId, state.searchTerm, state.sortBy, state.order, currentView]);

    useEffect(() => {
        if (userLoaded) {
            fetchContent();
        }
    }, [userLoaded, fetchContent]);

    const handleViewChange = (view: ViewType) => {
        setCurrentView(view);
        setState(prev => ({ 
            ...prev, 
            currentPage: 1,
            currentFolderId: null, // Reset folder navigation when changing views
            breadcrumbs: [{ id: null, name: getViewDisplayName(view), path: '/' }],
            searchTerm: '' // Clear search when changing views
        }));
    };

    const getViewDisplayName = (view: ViewType) => {
        switch (view) {
            case 'all': return 'All Files';
            case 'recent': return 'Recent';
            case 'starred': return 'Starred';
            case 'trash': return 'Trash';
            default: return 'All Files';
        }
    };

    const handleFolderClick = (folderId: string) => {
        // Don't allow folder navigation in trash or recent views
        if (currentView === 'trash' || currentView === 'recent') {
            return;
        }

        const folder = state.items.find(item => item.id === folderId && item.type === 'folder');
        if (folder) {
            const newBreadcrumb = {
                id: folderId,
                name: folder.name,
                path: folder.path || `/${folder.name}`
            };
            
            setState(prev => ({
                ...prev,
                currentFolderId: folderId,
                breadcrumbs: [...prev.breadcrumbs, newBreadcrumb],
                currentPage: 1
            }));
        }
    };

    const handleBreadcrumbNavigation = (folderId: string | null) => {
        if (folderId === state.currentFolderId) return;

        const breadcrumbIndex = state.breadcrumbs.findIndex(b => b.id === folderId);
        const newBreadcrumbs = state.breadcrumbs.slice(0, breadcrumbIndex + 1);

        setState(prev => ({
            ...prev,
            currentFolderId: folderId,
            breadcrumbs: newBreadcrumbs,
            currentPage: 1
        }));
    };

    const handleStarToggle = async (item: CombinedContentItem) => {
        try {
            const endpoint = item.type === 'folder' 
                ? `/api/folder/${item.id}/star`
                : `/api/files/${item.id}/star`;
            
            const response = await axios.patch(endpoint);
            
            if (response.data.success) {
                setState(prev => ({
                    ...prev,
                    items: prev.items.map(i => 
                        i.id === item.id ? { ...i, isStarred: !i.isStarred } : i
                    )
                }));
                
                toast.success(`${item.type === 'folder' ? 'Folder' : 'File'} ${item.isStarred ? 'unstarred' : 'starred'}`);
            }
        } catch (error: any) {
            toast.error(`Failed to ${item.isStarred ? 'unstar' : 'star'} ${item.type}`, {
                description: error.response?.data?.message || 'Please try again'
            });
        }
    };

    const handleTrash = async (item: CombinedContentItem) => {
        try {
            const endpoint = item.type === 'folder'
                ? `/api/folder/${item.id}/trash`
                : `/api/files/${item.id}/trash`;

            const response = await axios.patch(endpoint);

            if (response.data.success) {
                setState(prev => ({
                    ...prev,
                    items: prev.items.filter(i => i.id !== item.id),
                    totalItems: prev.totalItems - 1
                }));

                toast.success(`${item.type === 'folder' ? 'Folder' : 'File'} moved to trash`);
            }
        } catch (error: any) {
            toast.error(`Failed to delete ${item.type}`, {
                description: error.response?.data?.message || 'Please try again'
            });
        }
    };

    const handleRename = async (item: CombinedContentItem) => {
        const newName = prompt(`Rename ${item.type}:`, item.name);
        if (!newName || newName === item.name) return;

        try {
            const endpoint = item.type === 'folder'
                ? `/api/folder/${item.id}/rename`
                : `/api/files/${item.id}/rename`;

            const response = await axios.patch(endpoint, { name: newName });

            if (response.data.success) {
                setState(prev => ({
                    ...prev,
                    items: prev.items.map(i =>
                        i.id === item.id ? { ...i, name: newName } : i
                    )
                }));

                toast.success(`${item.type === 'folder' ? 'Folder' : 'File'} renamed successfully`);
            }
        } catch (error: any) {
            toast.error(`Failed to rename ${item.type}`, {
                description: error.response?.data?.message || 'Please try again'
            });
        }
    };

    const handleMove = async (item: CombinedContentItem) => {
        toast.info('Move functionality coming soon!');
    };

    const handleShare = async (item: CombinedContentItem) => {
        toast.info('Share functionality coming soon!');
    };

    const handleRefresh = () => {
        fetchContent();
    };

    const handlePageChange = (page: number) => {
        setState(prev => ({ ...prev, currentPage: page }));
    };

    const handleSearchChange = (searchTerm: string) => {
        setState(prev => ({ ...prev, searchTerm, currentPage: 1 }));
    };

    const handleSortChange = (sortBy: 'name' | 'createdAt' | 'updatedAt') => {
        setState(prev => ({ ...prev, sortBy, currentPage: 1 }));
    };

    const handleOrderChange = (order: 'asc' | 'desc') => {
        setState(prev => ({ ...prev, order, currentPage: 1 }));
    };

    const handleViewModeChange = (viewMode: 'grid' | 'list') => {
        setState(prev => ({ ...prev, viewMode }));
    };

    const handleUploadSuccess = () => {
        fetchContent();
        toast.success('Upload completed successfully!');
    };

    const handleFolderCreated = () => {
        fetchContent();
    };

    // Show skeleton for initial load OR when refreshing (loading with existing items)
    if (!userLoaded || state.loading) {
        return <BrowseLoadingSkeleton />;
    }

    if (state.error && state.items.length === 0) {
        return (
            <>
                <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                    <SidebarTrigger className="-ml-1" />
                    <Separator orientation="vertical" className="mr-2 h-4" />
                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem>
                                <BreadcrumbPage>Error</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </header>
                
                <div className="flex flex-1 flex-col gap-4 p-4">
                    <Card>
                        <CardContent className="pt-6">
                            <div className="text-center">
                                <p className="text-destructive mb-4">{state.error}</p>
                                <Button onClick={handleRefresh}>
                                    Retry
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </>
        );
    }

    const currentPlan = userProfile?.subscription?.plan || 'FREE';
    const canNavigateFolders = currentView === 'all' || currentView === 'starred';

    return (
        <>
                {/* Header */}
                <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                    <SidebarTrigger className="-ml-1" />
                    <Separator orientation="vertical" className="mr-2 h-4" />
                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem>
                                <BreadcrumbPage className="line-clamp-1">
                                    {getViewDisplayName(currentView)}
                                </BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                    
                    <div className="ml-auto">
                        <BrowseHeader
                            currentFolderId={state.currentFolderId}
                            onRefresh={handleRefresh}
                            onFolderCreated={handleFolderCreated}
                            onUploadSuccess={handleUploadSuccess}
                            isLoading={state.loading}
                            userPlan={currentPlan as 'FREE' | 'PRO_MONTHLY' | 'PRO_YEARLY'}
                        />
                    </div>
                </header>

                {/* Content Area */}
                <div className="flex flex-1 flex-col gap-4 p-4">
                    {/* Breadcrumb - only show for folder navigation views */}
                    {canNavigateFolders && state.breadcrumbs.length > 1 && (
                        <BreadcrumbNav
                            currentPath={state.breadcrumbs}
                            onNavigate={handleBreadcrumbNavigation}
                        />
                    )}

                    <SearchBar
                        searchTerm={state.searchTerm}
                        onSearchChange={handleSearchChange}
                        sortBy={state.sortBy}
                        onSortChange={handleSortChange}
                        order={state.order}
                        onOrderChange={handleOrderChange}
                        showStarred={false} // Handled by sidebar
                        onStarredToggle={() => {}} // Not used
                        showTrash={false} // Handled by sidebar
                        onTrashToggle={() => {}} // Not used
                        viewMode={state.viewMode}
                        onViewModeChange={handleViewModeChange}
                        hideFilters={currentView !== 'all'} // Hide filters for special views
                    />

                    <div className="flex items-center justify-between mb-4 text-sm text-muted-foreground">
                        <span>
                            {state.totalItems} {state.totalItems === 1 ? 'item' : 'items'}
                            {state.searchTerm && ` matching "${state.searchTerm}"`}
                        </span>
                    </div>

                    {state.items.length > 0 ? (
                        <>
                            <FileGrid
                                items={state.items}
                                onFolderClick={canNavigateFolders ? handleFolderClick : () => {}}
                                onStarToggle={handleStarToggle}
                                onTrash={handleTrash}
                                onRename={handleRename}
                                onMove={handleMove}
                                onShare={handleShare}
                                viewMode={state.viewMode}
                            />

                            {state.totalPages > 1 && (
                                <Pagination
                                    currentPage={state.currentPage}
                                    totalPages={state.totalPages}
                                    onPageChange={handlePageChange}
                                    className="mt-8"
                                />
                            )}
                        </>
                    ) : (
                        <Card>
                            <CardContent className="pt-6">
                                <div className="text-center py-12">
                                    <p className="text-muted-foreground text-lg mb-4">
                                        {state.searchTerm 
                                            ? `No items found matching "${state.searchTerm}"`
                                            : currentView === 'trash'
                                            ? 'Trash is empty'
                                            : currentView === 'starred'
                                            ? 'No starred items'
                                            : currentView === 'recent'
                                            ? 'No recent activity'
                                            : 'This folder is empty'
                                        }
                                    </p>
                                    {!state.searchTerm && currentView === 'all' && (
                                        <p className="text-sm text-muted-foreground">
                                            Start organizing your files by uploading or creating folders
                                        </p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </>
    );
}
