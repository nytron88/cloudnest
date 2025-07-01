'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Folder,
    FolderOpen,
    Home,
    ChevronRight,
    ArrowLeft,
    Check,
    Loader2,
    RotateCcw,
    ChevronDown,
    FolderPlus,
    FileText,
    Image as ImageIcon,
    Video,
    Music,
    FileType as FileTypeIcon
} from 'lucide-react';
import { cn } from '@/lib/utils/utils';
import { toast } from 'sonner';
import axios from 'axios';
import { CombinedContentItem } from '@/types/folder';
import { PaginatedResponse } from '@/types/pagination';
import { APIResponse } from '@/types/apiResponse';

interface FolderBrowserProps {
    selectedFolderId: string | null;
    onFolderSelect: (folderId: string | null) => void;
    className?: string;
}

interface NavigationHistory {
    id: string | null;
    name: string;
    items: CombinedContentItem[];
}

const getItemIcon = (item: CombinedContentItem) => {
    if (item.type === 'folder') {
        return <Folder className="h-4 w-4 text-blue-600 dark:text-blue-400" />;
    }

    // For files, use file type specific icons
    if (item.fileType === 'IMAGE') {
        return <ImageIcon className="w-4 h-4 text-blue-500" />;
    }
    if (item.fileType === 'VIDEO') {
        return <Video className="w-4 h-4 text-purple-500" />;
    }
    if (item.fileType === 'AUDIO') {
        return <Music className="w-4 h-4 text-green-500" />;
    }
    if (item.fileType === 'PDF' || item.fileType === 'DOCUMENT') {
        return <FileText className="w-4 h-4 text-red-500" />;
    }
    return <FileTypeIcon className="w-4 h-4 text-gray-500" />;
};

export function FolderBrowser({ selectedFolderId, onFolderSelect, className }: FolderBrowserProps) {
    const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
    const [items, setItems] = useState<CombinedContentItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [isExpanded, setIsExpanded] = useState(true);
    const [selectedFolderCache, setSelectedFolderCache] = useState<{ [key: string]: { name: string, path: string } }>({});
    const [navigationHistory, setNavigationHistory] = useState<NavigationHistory[]>([
        { id: null, name: 'Root', items: [] }
    ]);

    const loadContent = useCallback(async (folderId: string | null) => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                pageSize: '100',
                isTrash: 'false',
                sortBy: 'name',
                order: 'asc'
            });

            if (folderId) {
                params.append('folderId', folderId);
            }

            const response = await axios.get<APIResponse<PaginatedResponse<CombinedContentItem>>>(
                `/api/search?${params.toString()}`
            );

            if (response.data.success && response.data.payload) {
                const contentData = response.data.payload.data;

                // Sort items: folders first, then files
                const sortedItems = contentData.sort((a, b) => {
                    if (a.type === 'folder' && b.type === 'file') return -1;
                    if (a.type === 'file' && b.type === 'folder') return 1;
                    return a.name.localeCompare(b.name);
                });

                setItems(sortedItems);

                // Cache all folders we see for better path resolution
                const folderCache: { [key: string]: { name: string, path: string } } = {};
                sortedItems.forEach(item => {
                    if (item.type === 'folder') {
                        folderCache[item.id] = {
                            name: item.name,
                            path: item.path
                        };
                    }
                });
                setSelectedFolderCache(prev => ({ ...prev, ...folderCache }));

                // Update navigation history
                setNavigationHistory(prev => {
                    const newHistory = [...prev];
                    const currentIndex = newHistory.findIndex(h => h.id === folderId);
                    if (currentIndex >= 0) {
                        // Update existing entry
                        newHistory[currentIndex].items = sortedItems;
                        // Remove entries after current
                        return newHistory.slice(0, currentIndex + 1);
                    }
                    return newHistory;
                });
            }
        } catch (error) {
            console.error('Failed to load content:', error);
            toast.error('Failed to load folder contents', {
                description: 'Please try refreshing or check your connection'
            });
            setItems([]);
        } finally {
            setLoading(false);
        }
    }, []);

    const navigateToFolder = async (folder: CombinedContentItem) => {
        if (folder.type !== 'folder') return; // Only folders are navigable

        setCurrentFolderId(folder.id);

        // Cache the folder path when navigating
        setSelectedFolderCache(prev => ({
            ...prev,
            [folder.id]: {
                name: folder.name,
                path: folder.path
            }
        }));

        // Add to navigation history
        setNavigationHistory(prev => [
            ...prev,
            { id: folder.id, name: folder.name, items: [] }
        ]);

        await loadContent(folder.id);
    };

        const navigateToHistoryItem = async (index: number) => {
        const historyItem = navigationHistory[index];
        setCurrentFolderId(historyItem.id);
        
        // Cache the history item path if we have it
        if (historyItem.id) {
            const pathFromHistory = '/' + navigationHistory.slice(1, index + 1).map(h => h.name).join('/');
            setSelectedFolderCache(prev => ({
                ...prev,
                [historyItem.id!]: {
                    name: historyItem.name,
                    path: pathFromHistory
                }
            }));
        }
        
        // Trim history to this point
        setNavigationHistory(prev => prev.slice(0, index + 1));
        
        // Use cached items if available, otherwise load
        if (historyItem.items.length > 0) {
            setItems(historyItem.items);
        } else {
            await loadContent(historyItem.id);
        }
    };

    const goBack = () => {
        if (navigationHistory.length > 1) {
            navigateToHistoryItem(navigationHistory.length - 2);
        }
    };

    const getCurrentFolderName = () => {
        return navigationHistory[navigationHistory.length - 1]?.name || 'Root';
    };

    const getSelectedFolderInfo = () => {
        if (selectedFolderId === null) {
            return { name: 'Root Folder', path: '/', isRoot: true };
        }

        // Look for selected folder in current items first
        let selectedFolder = items.find(f => f.id === selectedFolderId && f.type === 'folder');

        // If not found in current items, look through navigation history
        if (!selectedFolder) {
            // Check if the selected folder is one of the navigation history items itself
            for (const historyItem of navigationHistory) {
                if (historyItem.id === selectedFolderId) {
                    // Build path from navigation history
                    const pathParts = [];
                    for (let i = 0; i <= navigationHistory.indexOf(historyItem); i++) {
                        if (navigationHistory[i].name !== 'Root') {
                            pathParts.push(navigationHistory[i].name);
                        }
                    }
                    const fullPath = pathParts.length > 0 ? `/${pathParts.join('/')}` : '/';

                    return {
                        name: historyItem.name,
                        path: fullPath,
                        isRoot: false
                    };
                }
                // Look for the folder in the items of each history entry
                const found = historyItem.items.find(item => item.id === selectedFolderId && item.type === 'folder');
                if (found) {
                    selectedFolder = found;
                    break;
                }
            }
        }

        // If still not found, use cached information
        if (!selectedFolder) {
            const cached = selectedFolderCache[selectedFolderId];
            if (cached) {
                return {
                    name: cached.name,
                    path: cached.path,
                    isRoot: false
                };
            }
            // Absolute last resort
            return {
                name: 'Unknown Folder',
                path: '/unknown',
                isRoot: false
            };
        }

        return {
            name: selectedFolder.name,
            path: selectedFolder.path,
            isRoot: false
        };
    };

    useEffect(() => {
        loadContent(null);
    }, [loadContent]);

    const selectedInfo = getSelectedFolderInfo();

    return (
        <Card className={cn("w-full transition-all duration-300 hover:shadow-md", className)}>
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-full">
                            <FolderOpen className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <CardTitle className="text-lg font-semibold">Choose Upload Destination</CardTitle>
                            <CardDescription>
                                Navigate through folders and click "Select" to choose upload location
                            </CardDescription>
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="h-8 w-8 p-0"
                    >
                        <ChevronDown className={cn("h-4 w-4 transition-transform", isExpanded && "rotate-180")} />
                    </Button>
                </div>
            </CardHeader>

            {isExpanded && (
                <CardContent className="space-y-4">
                    {/* Navigation Controls */}
                    <div className="flex items-center justify-between bg-muted/50 rounded-lg p-3 border">
                        <div className="flex items-center space-x-2 min-w-0 flex-1">
                            <Home className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            {/* Breadcrumb navigation */}
                            <div className="flex items-center space-x-1 text-sm min-w-0 flex-1">
                                {navigationHistory.map((navItem, index) => (
                                    <div key={`${navItem.id}-${index}`} className="flex items-center min-w-0">
                                        {index > 0 && <ChevronRight className="h-3 w-3 text-muted-foreground mx-1 flex-shrink-0" />}
                                        <span
                                            className={cn(
                                                "truncate transition-colors",
                                                index === navigationHistory.length - 1
                                                    ? "text-foreground font-medium"
                                                    : "text-muted-foreground hover:text-foreground cursor-pointer hover:bg-background px-2 py-1 rounded"
                                            )}
                                            onClick={() => index < navigationHistory.length - 1 && navigateToHistoryItem(index)}
                                        >
                                            {navItem.name}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex items-center space-x-2 flex-shrink-0">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={goBack}
                                disabled={navigationHistory.length <= 1}
                                className="h-8"
                            >
                                <ArrowLeft className="h-3 w-3 mr-1" />
                                Back
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => loadContent(currentFolderId)}
                                disabled={loading}
                                className="h-8"
                            >
                                <RotateCcw className={cn("h-3 w-3", loading && "animate-spin")} />
                            </Button>
                        </div>
                    </div>

                    {/* Quick Select Current Folder */}
                    <div className={cn(
                        "flex items-center justify-between p-3 rounded-lg border transition-all duration-200",
                        selectedFolderId === currentFolderId
                            ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
                            : "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                    )}>
                        <div className="flex items-center space-x-3">
                            <div className={cn(
                                "p-2 rounded-full",
                                selectedFolderId === currentFolderId
                                    ? "bg-blue-100 dark:bg-blue-900/20"
                                    : "bg-green-100 dark:bg-green-900/20"
                            )}>
                                {selectedFolderId === currentFolderId ? (
                                    <Check className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                ) : (
                                    <Folder className="h-4 w-4 text-green-600 dark:text-green-400" />
                                )}
                            </div>
                            <div>
                                <div className={cn(
                                    "text-sm font-medium",
                                    selectedFolderId === currentFolderId
                                        ? "text-blue-800 dark:text-blue-200"
                                        : "text-green-800 dark:text-green-200"
                                )}>
                                    Current Location: {getCurrentFolderName()}
                                </div>
                                <div className={cn(
                                    "text-xs",
                                    selectedFolderId === currentFolderId
                                        ? "text-blue-600 dark:text-blue-400"
                                        : "text-green-600 dark:text-green-400"
                                )}>
                                    {selectedFolderId === currentFolderId ? "Selected as upload destination" : "Click to select this folder for upload"}
                                </div>
                            </div>
                        </div>
                        {selectedFolderId !== currentFolderId && (
                                                    <Button
                            size="sm"
                            onClick={() => {
                                onFolderSelect(currentFolderId);
                                const folderName = getCurrentFolderName();
                                
                                if (currentFolderId) {
                                    // Use cached path or construct from navigation
                                    const cachedInfo = selectedFolderCache[currentFolderId];
                                    const actualPath = cachedInfo?.path || 
                                        '/' + navigationHistory.slice(1).map(h => h.name).join('/');
                                    
                                    setSelectedFolderCache(prev => ({
                                        ...prev,
                                        [currentFolderId]: {
                                            name: getCurrentFolderName(),
                                            path: actualPath
                                        }
                                    }));
                                    
                                    toast.success(`Selected "${folderName}" as upload destination`);
                                } else {
                                    toast.success('Selected Root folder as upload destination');
                                }
                            }}
                            className="bg-green-600 hover:bg-green-700 text-white h-8"
                        >
                            <Check className="h-3 w-3 mr-1" />
                            Select
                        </Button>
                        )}
                    </div>

                    {/* Content List */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h4 className="text-sm font-medium text-muted-foreground">
                                Content ({items.filter(i => i.type === 'folder').length} folders, {items.filter(i => i.type === 'file').length} files)
                            </h4>
                        </div>

                        {loading ? (
                            <div className="space-y-2">
                                {[...Array(3)].map((_, i) => (
                                    <div key={i} className="flex items-center space-x-3 p-3 rounded-lg bg-muted/30 animate-pulse">
                                        <div className="h-8 w-8 bg-muted-foreground/20 rounded-lg" />
                                        <div className="flex-1 space-y-2">
                                            <div className="h-4 bg-muted-foreground/20 rounded w-3/4" />
                                            <div className="h-3 bg-muted-foreground/10 rounded w-1/2" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : items.length > 0 ? (
                            <div className="max-h-48 overflow-y-auto space-y-2 pr-2">
                                {items.map((item) => (
                                    <div
                                        key={item.id}
                                        className={cn(
                                            "group flex items-center space-x-3 p-3 rounded-lg border transition-all duration-200",
                                            item.type === 'folder' && selectedFolderId === item.id
                                                ? "border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20"
                                                : item.type === 'folder'
                                                    ? "border-border hover:border-blue-200 dark:hover:border-blue-800 bg-card hover:bg-blue-50/50 dark:hover:bg-blue-900/10"
                                                    : "border-border/50 bg-muted/30 opacity-75"
                                        )}
                                    >
                                        <div
                                            className={cn(
                                                "p-2 rounded-lg transition-colors cursor-pointer",
                                                item.type === 'folder' && selectedFolderId === item.id
                                                    ? "bg-blue-200 dark:bg-blue-800/50"
                                                    : item.type === 'folder'
                                                        ? "bg-blue-100 dark:bg-blue-900/20 group-hover:bg-blue-200 dark:group-hover:bg-blue-800/30"
                                                        : "bg-muted"
                                            )}
                                            onDoubleClick={() => item.type === 'folder' ? navigateToFolder(item) : undefined}
                                            title={item.type === 'folder' ? "Double-click to navigate into folder" : undefined}
                                        >
                                            {item.type === 'folder' && selectedFolderId === item.id ? (
                                                <Check className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                            ) : (
                                                getItemIcon(item)
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className={cn(
                                                "text-sm font-medium truncate transition-colors",
                                                item.type === 'folder' && selectedFolderId === item.id
                                                    ? "text-blue-700 dark:text-blue-300"
                                                    : item.type === 'folder'
                                                        ? "text-foreground group-hover:text-blue-700 dark:group-hover:text-blue-300"
                                                        : "text-muted-foreground"
                                            )}>
                                                {item.name}
                                                {item.type === 'file' && (
                                                    <span className="ml-2 text-xs px-2 py-0.5 bg-muted-foreground/20 rounded text-muted-foreground">
                                                        file
                                                    </span>
                                                )}
                                                {item.type === 'folder' && selectedFolderId === item.id && (
                                                    <span className="ml-2 text-xs px-2 py-0.5 bg-blue-200 dark:bg-blue-800 rounded text-blue-700 dark:text-blue-300">
                                                        selected
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-xs text-muted-foreground truncate">
                                                {item.path}
                                            </div>
                                        </div>
                                        {item.type === 'folder' && (
                                            <div className="flex items-center space-x-2 flex-shrink-0">
                                                {selectedFolderId !== item.id ? (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onFolderSelect(item.id);

                                                            setSelectedFolderCache(prev => ({
                                                                ...prev,
                                                                [item.id]: {
                                                                    name: item.name,
                                                                    path: item.path
                                                                }
                                                            }));
                                                            toast.success(`Selected "${item.name}" as upload destination`);
                                                        }}
                                                        className="h-7 px-2 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        Select
                                                    </Button>
                                                ) : (
                                                    <span className="text-xs text-blue-600 dark:text-blue-400 font-medium px-2">
                                                        ✓ Selected
                                                    </span>
                                                )}
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        navigateToFolder(item);
                                                    }}
                                                    className="h-7 w-7 p-0 opacity-70 group-hover:opacity-100 transition-opacity"
                                                    title="Navigate into folder"
                                                >
                                                    <ChevronRight className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-4 text-muted-foreground">
                                <div className="p-2 bg-muted/50 rounded-full w-10 h-10 mx-auto mb-2 flex items-center justify-center">
                                    <FolderPlus className="h-5 w-5 opacity-50" />
                                </div>
                                <p className="text-sm font-medium">No content found</p>
                                <p className="text-xs text-muted-foreground">This directory is empty</p>
                            </div>
                        )}
                    </div>

                    {/* Selected Destination Display */}
                    <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border-2 border-blue-200 dark:border-blue-800 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                    <Check className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                                        Upload Destination
                                    </div>
                                    <div className="text-lg font-bold text-blue-800 dark:text-blue-200 truncate">
                                        {selectedInfo.name}
                                    </div>
                                    <div className="text-xs text-blue-600 dark:text-blue-400 truncate">
                                        {selectedInfo.path}
                                    </div>
                                </div>
                            </div>
                            {selectedFolderId !== null && (
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                        onFolderSelect(null);
                                        toast.info('Cleared selection - uploads will go to Root folder');
                                    }}
                                    className="h-8 text-xs border-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/40"
                                >
                                    Clear
                                </Button>
                            )}
                        </div>
                    </div>
                </CardContent>
            )}
        </Card>
    );
} 