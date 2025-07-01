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
import { CombinedContentItem } from '@/types/folder';
import { PaginatedResponse } from '@/types/pagination';
import { APIResponse } from '@/types/apiResponse';
import { UserProfileResponseData } from '@/types/user';

interface BreadcrumbItem {
    id: string | null;
    name: string;
    path: string;
}

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
    showStarred: boolean;
    showTrash: boolean;
    viewMode: 'grid' | 'list';
    userProfile: UserProfileResponseData | null;
}

export default function BrowsePage() {
    const { user, isLoaded: userLoaded } = useUser();
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
        showStarred: false,
        showTrash: false,
        viewMode: 'grid',
        userProfile: null
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

            if (state.currentFolderId) params.append('folderId', state.currentFolderId);
            if (state.searchTerm) params.append('search', state.searchTerm);
            if (state.showStarred) params.append('isStarred', 'true');
            if (state.showTrash) params.append('isTrash', 'true');

            const response = await axios.get<APIResponse<PaginatedResponse<CombinedContentItem>>>(
                `/api/search?${params.toString()}`
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
    }, [state.currentPage, state.currentFolderId, state.searchTerm, state.sortBy, state.order, state.showStarred, state.showTrash]);

    const fetchUserProfile = useCallback(async () => {
        try {
            const response = await axios.get<APIResponse<UserProfileResponseData>>('/api/user/me');
            if (response.data.success) {
                setState(prev => ({ ...prev, userProfile: response.data.payload || null }));
            }
        } catch (error) {
            console.error('Failed to fetch user profile:', error);
        }
    }, []);

    useEffect(() => {
        if (userLoaded) {
            fetchContent();
            fetchUserProfile();
        }
    }, [userLoaded, fetchContent, fetchUserProfile]);

    const handleFolderClick = (folderId: string) => {
        // Find the folder to navigate to
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

    const handleStarredToggle = () => {
        setState(prev => ({ ...prev, showStarred: !prev.showStarred, currentPage: 1 }));
    };

    const handleTrashToggle = () => {
        setState(prev => ({ ...prev, showTrash: !prev.showTrash, currentPage: 1 }));
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

    if (!userLoaded || (state.loading && state.items.length === 0)) {
        return <BrowseLoadingSkeleton />;
    }

    if (state.error && state.items.length === 0) {
        return (
            <div className="min-h-screen bg-background">
                <div className="container max-w-7xl mx-auto px-3 sm:px-4 py-6 sm:py-8">
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
            </div>
        );
    }

    const currentPlan = state.userProfile?.subscription?.plan || 'FREE';

    return (
        <div className="min-h-screen bg-background">
            <div className="container max-w-7xl mx-auto px-3 sm:px-4 py-6 sm:py-8">
                <BrowseHeader
                    currentFolderId={state.currentFolderId}
                    onRefresh={handleRefresh}
                    onFolderCreated={handleFolderCreated}
                    onUploadSuccess={handleUploadSuccess}
                    isLoading={state.loading}
                    userPlan={currentPlan as 'FREE' | 'PRO_MONTHLY' | 'PRO_YEARLY'}
                />

                <BreadcrumbNav
                    currentPath={state.breadcrumbs}
                    onNavigate={handleBreadcrumbNavigation}
                    className="mb-4"
                />

                <SearchBar
                    searchTerm={state.searchTerm}
                    onSearchChange={handleSearchChange}
                    sortBy={state.sortBy}
                    onSortChange={handleSortChange}
                    order={state.order}
                    onOrderChange={handleOrderChange}
                    showStarred={state.showStarred}
                    onStarredToggle={handleStarredToggle}
                    showTrash={state.showTrash}
                    onTrashToggle={handleTrashToggle}
                    viewMode={state.viewMode}
                    onViewModeChange={handleViewModeChange}
                />

                <div className="flex items-center justify-between mb-4 text-sm text-muted-foreground">
                    <span>
                        {state.totalItems} {state.totalItems === 1 ? 'item' : 'items'}
                        {state.searchTerm && ` matching "${state.searchTerm}"`}
                    </span>
                    {state.loading && <span>Loading...</span>}
                </div>

                {state.items.length > 0 ? (
                    <>
                        <FileGrid
                            items={state.items}
                            onFolderClick={handleFolderClick}
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
                                        : state.showTrash
                                        ? 'Trash is empty'
                                        : state.showStarred
                                        ? 'No starred items'
                                        : 'This folder is empty'
                                    }
                                </p>
                                {!state.searchTerm && !state.showTrash && !state.showStarred && (
                                    <p className="text-sm text-muted-foreground">
                                        Start organizing your files by uploading or creating folders
                                    </p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
