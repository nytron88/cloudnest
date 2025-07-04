'use client';

import { useState } from 'react';
import { Plus, Upload, FolderPlus, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
    DropdownMenu, 
    DropdownMenuContent, 
    DropdownMenuItem, 
    DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { UploadDialog } from '@/components/upload';
import { CreateFolderDialog } from './create-folder-dialog';

interface BrowseHeaderProps {
    currentFolderId: string | null;
    onRefresh: () => void;
    onFolderCreated: () => void;
    onUploadSuccess: () => void;
    isLoading?: boolean;
    userPlan?: 'FREE' | 'PRO_MONTHLY' | 'PRO_YEARLY';
}

export function BrowseHeader({
    currentFolderId,
    onRefresh,
    onFolderCreated,
    onUploadSuccess,
    isLoading = false,
    userPlan = 'FREE'
}: BrowseHeaderProps) {
    const [showCreateFolder, setShowCreateFolder] = useState(false);

    return (
        <>
            <div className="flex items-center gap-2">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={onRefresh}
                    disabled={isLoading}
                    className="gap-2 cursor-pointer"
                >
                    <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                    <span className="hidden sm:inline">Refresh</span>
                </Button>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button className="gap-2 cursor-pointer">
                            <Plus className="h-4 w-4" />
                            <span className="hidden sm:inline">New</span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setShowCreateFolder(true)} className="cursor-pointer">
                            <FolderPlus className="h-4 w-4 mr-2" />
                            Create Folder
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

                <UploadDialog
                    folderId={currentFolderId}
                    userPlan={userPlan}
                    onUploadSuccess={onUploadSuccess}
                    trigger={
                        <Button className="gap-2 cursor-pointer">
                            <Upload className="h-4 w-4" />
                            <span className="hidden sm:inline">Upload</span>
                        </Button>
                    }
                />
            </div>

            <CreateFolderDialog
                isOpen={showCreateFolder}
                onClose={() => setShowCreateFolder(false)}
                parentId={currentFolderId}
                onSuccess={onFolderCreated}
            />
        </>
    );
} 