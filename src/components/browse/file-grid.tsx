'use client';

import { useState } from 'react';
import { 
    MoreVertical, 
    Star, 
    Trash2, 
    Edit, 
    Move, 
    Share, 
    Folder, 
    File as FileIcon,
    Image as ImageIcon,
    Video,
    Music,
    Archive,
    FileText,
    Eye
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
    DropdownMenu, 
    DropdownMenuContent, 
    DropdownMenuItem, 
    DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { CombinedContentItem } from '@/types/folder';
import { formatFileSize, formatDate } from '@/lib/utils/dashboard-helpers';
import { FilePreview } from './file-preview';
import { cn } from '@/lib/utils/utils';

interface FileGridProps {
    items: CombinedContentItem[];
    onFolderClick: (folderId: string) => void;
    onStarToggle: (item: CombinedContentItem) => void;
    onTrash: (item: CombinedContentItem) => void;
    onRename: (item: CombinedContentItem) => void;
    onMove: (item: CombinedContentItem) => void;
    onShare: (item: CombinedContentItem) => void;
    viewMode: 'grid' | 'list';
}

const getFileIcon = (fileType: string) => {
    if (!fileType) return FileIcon;
    const type = fileType.toLowerCase();
    if (type.includes('image')) return ImageIcon;
    if (type.includes('video')) return Video;
    if (type.includes('audio')) return Music;
    if (type.includes('zip') || type.includes('rar') || type.includes('7z')) return Archive;
    if (type.includes('pdf') || type.includes('doc')) return FileText;
    return FileIcon;
};

const getImageKitThumbnail = (fileUrl: string) => {
    if (!fileUrl) return '';
    
    // Extract the path from ImageKit URL
    const urlParts = fileUrl.split('/');
    const pathIndex = urlParts.findIndex(part => part.includes('ik.imagekit.io'));
    
    if (pathIndex === -1) return fileUrl;
    
    const baseUrl = urlParts.slice(0, pathIndex + 2).join('/');
    const filePath = urlParts.slice(pathIndex + 2).join('/');
    
    // Generate thumbnail with ImageKit transformations
    return `${baseUrl}/tr:w-200,h-200,c-at_max,f-auto,q-80/${filePath}`;
};

const isImageFile = (fileType: string) => {
    return fileType && fileType.toLowerCase().includes('image');
};

interface FileItemProps {
    item: CombinedContentItem;
    onFolderClick: (folderId: string) => void;
    onStarToggle: (item: CombinedContentItem) => void;
    onTrash: (item: CombinedContentItem) => void;
    onRename: (item: CombinedContentItem) => void;
    onMove: (item: CombinedContentItem) => void;
    onShare: (item: CombinedContentItem) => void;
    onPreview: (item: CombinedContentItem) => void;
    viewMode: 'grid' | 'list';
}

function FileItem({ 
    item, 
    onFolderClick, 
    onStarToggle, 
    onTrash, 
    onRename, 
    onMove, 
    onShare, 
    onPreview,
    viewMode 
}: FileItemProps) {
    const [imageError, setImageError] = useState(false);
    
    const isFolder = item.type === 'folder';
    const isImage = !isFolder && isImageFile(item.fileType || '');
    const Icon = isFolder ? Folder : getFileIcon(item.fileType || '');
    
    const thumbnailUrl = isImage && item.fileUrl && !imageError 
        ? getImageKitThumbnail(item.fileUrl) 
        : null;

    const handleItemClick = () => {
        if (isFolder) {
            onFolderClick(item.id);
        } else {
            onPreview(item);
        }
    };

    if (viewMode === 'list') {
        return (
            <div className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-all duration-200">
                <div className="flex-shrink-0">
                    {thumbnailUrl ? (
                        <img
                            src={thumbnailUrl}
                            alt={item.name}
                            className="w-10 h-10 rounded object-cover"
                            onError={() => setImageError(true)}
                        />
                    ) : (
                        <Icon className={cn(
                            "w-10 h-10 p-2 rounded",
                            isFolder 
                                ? "text-blue-600 bg-blue-100 dark:bg-blue-900/20" 
                                : "text-muted-foreground bg-muted"
                        )} />
                    )}
                </div>
                
                <div className="flex-1 min-w-0 cursor-pointer" onClick={handleItemClick}>
                    <div className="flex items-center gap-2">
                        <p className="font-medium truncate">{item.name}</p>
                        {item.isStarred && <Star className="h-4 w-4 text-amber-500 fill-current" />}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>
                            {isFolder ? 'Folder' : `${formatFileSize(item.size || 0)}`}
                        </span>
                        <span>{formatDate(item.updatedAt)}</span>
                    </div>
                </div>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        {!isFolder && (
                            <DropdownMenuItem onClick={() => onPreview(item)}>
                                <Eye className="h-4 w-4 mr-2" />
                                Preview
                            </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => onStarToggle(item)}>
                            <Star className={cn("h-4 w-4 mr-2", item.isStarred && "fill-current text-amber-500")} />
                            {item.isStarred ? 'Unstar' : 'Star'}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onRename(item)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Rename
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onMove(item)}>
                            <Move className="h-4 w-4 mr-2" />
                            Move
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onShare(item)}>
                            <Share className="h-4 w-4 mr-2" />
                            Share
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onTrash(item)} className="text-destructive">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        );
    }

    // Grid view
    return (
        <div className="group relative bg-card rounded-lg border p-4 hover:shadow-md transition-all duration-200">
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        {!isFolder && (
                            <DropdownMenuItem onClick={() => onPreview(item)}>
                                <Eye className="h-4 w-4 mr-2" />
                                Preview
                            </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => onStarToggle(item)}>
                            <Star className={cn("h-4 w-4 mr-2", item.isStarred && "fill-current text-amber-500")} />
                            {item.isStarred ? 'Unstar' : 'Star'}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onRename(item)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Rename
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onMove(item)}>
                            <Move className="h-4 w-4 mr-2" />
                            Move
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onShare(item)}>
                            <Share className="h-4 w-4 mr-2" />
                            Share
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onTrash(item)} className="text-destructive">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            <div className="cursor-pointer" onClick={handleItemClick}>
                <div className="mb-3 flex items-center justify-center h-24">
                    {thumbnailUrl ? (
                        <img
                            src={thumbnailUrl}
                            alt={item.name}
                            className="max-w-full max-h-full object-cover rounded"
                            onError={() => setImageError(true)}
                        />
                    ) : (
                        <Icon className={cn(
                            "w-16 h-16",
                            isFolder 
                                ? "text-blue-600" 
                                : "text-muted-foreground"
                        )} />
                    )}
                </div>
                
                <div className="space-y-1">
                    <div className="flex items-center gap-1">
                        <p className="font-medium text-sm truncate flex-1">{item.name}</p>
                        {item.isStarred && <Star className="h-3 w-3 text-amber-500 fill-current flex-shrink-0" />}
                    </div>
                    <p className="text-xs text-muted-foreground">
                        {isFolder ? 'Folder' : formatFileSize(item.size || 0)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                        {formatDate(item.updatedAt)}
                    </p>
                </div>
            </div>
        </div>
    );
}

export function FileGrid({ 
    items, 
    onFolderClick, 
    onStarToggle, 
    onTrash, 
    onRename, 
    onMove, 
    onShare,
    viewMode 
}: FileGridProps) {
    const [previewFile, setPreviewFile] = useState<CombinedContentItem | null>(null);

    const handlePreview = (item: CombinedContentItem) => {
        setPreviewFile(item);
    };

    return (
        <>
            <div className={cn(
                viewMode === 'grid' 
                    ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4"
                    : "space-y-2"
            )}>
                {items.map((item) => (
                    <FileItem
                        key={item.id}
                        item={item}
                        onFolderClick={onFolderClick}
                        onStarToggle={onStarToggle}
                        onTrash={onTrash}
                        onRename={onRename}
                        onMove={onMove}
                        onShare={onShare}
                        onPreview={handlePreview}
                        viewMode={viewMode}
                    />
                ))}
            </div>

            {previewFile && (
                <FilePreview
                    file={previewFile}
                    isOpen={!!previewFile}
                    onClose={() => setPreviewFile(null)}
                />
            )}
        </>
    );
} 