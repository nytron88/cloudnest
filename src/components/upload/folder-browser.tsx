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
    FolderPlus
} from 'lucide-react';
import { cn } from '@/lib/utils/utils';
import axios from 'axios';
import { Folder as FolderType } from '@/types/folder';
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
    folders: FolderType[];
}

export function FolderBrowser({ selectedFolderId, onFolderSelect, className }: FolderBrowserProps) {
    const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
    const [folders, setFolders] = useState<FolderType[]>([]);
    const [loading, setLoading] = useState(false);
    const [isExpanded, setIsExpanded] = useState(true);
    const [navigationHistory, setNavigationHistory] = useState<NavigationHistory[]>([
        { id: null, name: 'Root', folders: [] }
    ]);

    const loadFolders = useCallback(async (parentId: string | null) => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                pageSize: '100',
                isTrash: 'false',
                sortBy: 'name',
                order: 'asc'
            });
            
            if (parentId) {
                params.append('parentId', parentId);
            }

            const response = await axios.get<APIResponse<PaginatedResponse<FolderType>>>(
                `/api/folder?${params.toString()}`
            );
            
            if (response.data.success && response.data.payload) {
                const folderData = response.data.payload.data;
                setFolders(folderData);
                
                // Update navigation history
                setNavigationHistory(prev => {
                    const newHistory = [...prev];
                    const currentIndex = newHistory.findIndex(h => h.id === parentId);
                    if (currentIndex >= 0) {
                        // Update existing entry
                        newHistory[currentIndex].folders = folderData;
                        // Remove entries after current
                        return newHistory.slice(0, currentIndex + 1);
                    }
                    return newHistory;
                });
            }
        } catch (error) {
            console.error('Failed to load folders:', error);
            setFolders([]);
        } finally {
            setLoading(false);
        }
    }, []);

    const navigateToFolder = async (folder: FolderType) => {
        setCurrentFolderId(folder.id);
        
        // Add to navigation history
        setNavigationHistory(prev => [
            ...prev,
            { id: folder.id, name: folder.name, folders: [] }
        ]);
        
        await loadFolders(folder.id);
    };

    const navigateToHistoryItem = async (index: number) => {
        const historyItem = navigationHistory[index];
        setCurrentFolderId(historyItem.id);
        
        // Trim history to this point
        setNavigationHistory(prev => prev.slice(0, index + 1));
        
        // Use cached folders if available, otherwise load
        if (historyItem.folders.length > 0) {
            setFolders(historyItem.folders);
        } else {
            await loadFolders(historyItem.id);
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
            return { name: 'Root Folder', path: '/' };
        }
        
        const selectedFolder = folders.find(f => f.id === selectedFolderId) || 
                              navigationHistory[navigationHistory.length - 1];
        
        return {
            name: selectedFolder?.name || 'Selected Folder',
            path: folders.find(f => f.id === selectedFolderId)?.path || '...'
        };
    };

    useEffect(() => {
        loadFolders(null);
    }, [loadFolders]);

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
                            <CardTitle className="text-lg font-semibold">Choose Destination</CardTitle>
                            <CardDescription>Select where to upload your files</CardDescription>
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
                                onClick={() => loadFolders(currentFolderId)}
                                disabled={loading}
                                className="h-8"
                            >
                                <RotateCcw className={cn("h-3 w-3", loading && "animate-spin")} />
                            </Button>
                        </div>
                    </div>

                    {/* Quick Select Current Folder */}
                    <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                        <div className="flex items-center space-x-3">
                            <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-full">
                                <Folder className="h-4 w-4 text-green-600 dark:text-green-400" />
                            </div>
                            <div>
                                <div className="text-sm font-medium text-green-800 dark:text-green-200">
                                    Current: {getCurrentFolderName()}
                                </div>
                                <div className="text-xs text-green-600 dark:text-green-400">
                                    Click to select this folder
                                </div>
                            </div>
                        </div>
                        <Button
                            size="sm"
                            onClick={() => onFolderSelect(currentFolderId)}
                            className="bg-green-600 hover:bg-green-700 text-white h-8"
                        >
                            <Check className="h-3 w-3 mr-1" />
                            Select
                        </Button>
                    </div>

                    {/* Folders List */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h4 className="text-sm font-medium text-muted-foreground">
                                Folders ({folders.length})
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
                        ) : folders.length > 0 ? (
                            <div className="max-h-48 overflow-y-auto space-y-2 pr-2">
                                {folders.map((folder) => (
                                    <div
                                        key={folder.id}
                                        onClick={() => navigateToFolder(folder)}
                                        className="group flex items-center space-x-3 p-3 rounded-lg border border-border hover:border-blue-200 dark:hover:border-blue-800 bg-card hover:bg-blue-50/50 dark:hover:bg-blue-900/10 cursor-pointer transition-all duration-200 hover:shadow-sm"
                                    >
                                        <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg group-hover:bg-blue-200 dark:group-hover:bg-blue-800/30 transition-colors">
                                            <Folder className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-medium text-foreground truncate group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors">
                                                {folder.name}
                                            </div>
                                            <div className="text-xs text-muted-foreground truncate">
                                                {folder.path}
                                            </div>
                                        </div>
                                        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors flex-shrink-0" />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-muted-foreground">
                                <div className="p-4 bg-muted/50 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                                    <FolderPlus className="h-8 w-8 opacity-50" />
                                </div>
                                <p className="text-sm font-medium">No folders found</p>
                                <p className="text-xs text-muted-foreground mt-1">This directory is empty</p>
                            </div>
                        )}
                    </div>

                    {/* Selected Destination Display */}
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                        <div className="flex items-center space-x-3">
                            <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                                <Check className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-blue-800 dark:text-blue-200">
                                    Upload to: {selectedInfo.name}
                                </div>
                                <div className="text-xs text-blue-600 dark:text-blue-400 truncate">
                                    {selectedInfo.path}
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            )}
        </Card>
    );
} 