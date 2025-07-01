'use client';

import { useState } from 'react';
import { 
    FileText, 
    Image as ImageIcon, 
    Video, 
    Music, 
    Archive, 
    File as FileIcon,
    Eye,
    Download
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CombinedContentItem } from '@/types/folder';
import { formatFileSize } from '@/lib/utils/dashboard-helpers';

interface FilePreviewProps {
    file: CombinedContentItem;
    isOpen: boolean;
    onClose: () => void;
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

const isImageFile = (fileType: string) => {
    return fileType && fileType.toLowerCase().includes('image');
};

const isVideoFile = (fileType: string) => {
    return fileType && fileType.toLowerCase().includes('video');
};

const getImageKitUrl = (fileUrl: string, transformations = '') => {
    if (!fileUrl) return '';
    
    // Extract the path from ImageKit URL
    const urlParts = fileUrl.split('/');
    const pathIndex = urlParts.findIndex(part => part.includes('ik.imagekit.io'));
    
    if (pathIndex === -1) return fileUrl;
    
    const baseUrl = urlParts.slice(0, pathIndex + 2).join('/');
    const filePath = urlParts.slice(pathIndex + 2).join('/');
    
    if (transformations) {
        return `${baseUrl}/tr:${transformations}/${filePath}`;
    }
    
    return fileUrl;
};

export function FilePreview({ file, isOpen, onClose }: FilePreviewProps) {
    const [imageError, setImageError] = useState(false);
    const [videoError, setVideoError] = useState(false);

    if (file.type === 'folder') return null;

    const fileType = file.fileType || '';
    const FileIcon = getFileIcon(fileType);
    const isImage = isImageFile(fileType);
    const isVideo = isVideoFile(fileType);

    const thumbnailUrl = file.fileUrl ? getImageKitUrl(file.fileUrl, 'w-400,h-400,c-at_max,f-auto,q-80') : '';
    const fullSizeUrl = file.fileUrl ? getImageKitUrl(file.fileUrl, 'w-1200,h-800,c-at_max,f-auto,q-90') : '';

    const handleDownload = () => {
        if (file.fileUrl) {
            const link = document.createElement('a');
            link.href = file.fileUrl;
            link.download = file.name;
            link.target = '_blank';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-3">
                        <FileIcon className="h-5 w-5" />
                        <span className="truncate">{file.name}</span>
                    </DialogTitle>
                </DialogHeader>
                
                <div className="flex flex-col gap-4">
                    {/* Preview Area */}
                    <div className="bg-muted/30 rounded-lg p-6 flex items-center justify-center min-h-[300px] max-h-[500px] overflow-hidden">
                        {isImage && !imageError ? (
                            <img
                                src={fullSizeUrl}
                                alt={file.name}
                                className="max-w-full max-h-full object-contain rounded"
                                onError={() => setImageError(true)}
                            />
                        ) : isVideo && !videoError ? (
                            <video
                                src={file.fileUrl}
                                controls
                                className="max-w-full max-h-full rounded"
                                onError={() => setVideoError(true)}
                            >
                                Your browser does not support the video tag.
                            </video>
                        ) : (
                            <div className="text-center">
                                <FileIcon className="h-24 w-24 text-muted-foreground mx-auto mb-4" />
                                <p className="text-muted-foreground">
                                    {(isImage && imageError) || (isVideo && videoError) 
                                        ? 'Unable to preview this file' 
                                        : 'Preview not available for this file type'
                                    }
                                </p>
                            </div>
                        )}
                    </div>

                    {/* File Details */}
                    <div className="grid grid-cols-2 gap-4 p-4 bg-muted/20 rounded-lg">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">File Name</p>
                            <p className="font-medium truncate">{file.name}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">File Size</p>
                            <p className="font-medium">{formatFileSize(file.size || 0)}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">File Type</p>
                            <p className="font-medium">{fileType || 'Unknown'}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Last Modified</p>
                            <p className="font-medium">
                                {new Date(file.updatedAt).toLocaleDateString()}
                            </p>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-4 border-t">
                        <Button onClick={handleDownload} className="flex-1">
                            <Download className="h-4 w-4 mr-2" />
                            Download
                        </Button>
                        <Button variant="outline" onClick={onClose} className="flex-1">
                            Close
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
} 