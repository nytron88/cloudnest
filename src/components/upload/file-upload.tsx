'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    Upload,
    X,
    FileText,
    Image as ImageIcon,
    Video,
    Music,
    FileType,
    Check,
    AlertCircle,
    RotateCcw,
    CloudUpload,
    FileCheck,
    Loader2,
    FileX,
    Edit3
} from 'lucide-react';
import { cn } from '@/lib/utils/utils';
import { toast } from 'sonner';
import axios from 'axios';
import { isAllowedFile } from '@/lib/imagekit/isAllowedFile';
import {
    FREE_MAX_FILE_SIZE_BYTES,
    PRO_MAX_FILE_SIZE_BYTES
} from '@/lib/utils/constants';
import { ImageKitAuthParams } from '@/types/imagekit';
import { APIResponse } from '@/types/apiResponse';
import { File as FileResponse, mapFileType } from '@/types/file';
import { FolderBrowser } from './folder-browser';

interface UploadFile {
    id: string;
    file: File;
    originalName: string;
    currentName: string;
    progress: number;
    status: 'pending' | 'uploading' | 'success' | 'error' | 'name-conflict';
    error?: string;
    response?: FileResponse;
    isRenaming?: boolean;
}

interface FileUploadProps {
    /** Selected folder ID to upload files to */
    folderId?: string | null;
    /** Maximum number of files that can be uploaded at once */
    maxFiles?: number;
    /** User's subscription plan */
    userPlan?: 'FREE' | 'PRO_MONTHLY' | 'PRO_YEARLY';
    /** Callback when files are successfully uploaded */
    onUploadSuccess?: (files: FileResponse[]) => void;
    /** Callback when upload fails */
    onUploadError?: (error: string) => void;
    /** Additional CSS classes */
    className?: string;
    /** Show folder selector */
    showFolderSelector?: boolean;
}

const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase() || '';

    if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(extension)) {
        return <ImageIcon className="w-5 h-5 text-blue-500" />;
    }
    if (['mp4', 'avi', 'mkv', 'mov', 'webm'].includes(extension)) {
        return <Video className="w-5 h-5 text-purple-500" />;
    }
    if (['mp3', 'wav', 'ogg', 'flac'].includes(extension)) {
        return <Music className="w-5 h-5 text-green-500" />;
    }
    if (['pdf', 'doc', 'docx', 'txt', 'xls', 'xlsx', 'ppt', 'pptx'].includes(extension)) {
        return <FileText className="w-5 h-5 text-red-500" />;
    }
    return <FileType className="w-5 h-5 text-gray-500" />;
};

const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const getStatusIcon = (status: UploadFile['status']) => {
    switch (status) {
        case 'pending':
            return <CloudUpload className="w-4 h-4 text-blue-500" />;
        case 'uploading':
            return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
        case 'success':
            return <FileCheck className="w-4 h-4 text-green-500" />;
        case 'error':
            return <FileX className="w-4 h-4 text-red-500" />;
        case 'name-conflict':
            return <AlertCircle className="w-4 h-4 text-orange-500" />;
        default:
            return <FileType className="w-4 h-4 text-gray-500" />;
    }
};

export function FileUpload({
    folderId = null,
    maxFiles = 10,
    userPlan = 'FREE',
    onUploadSuccess,
    onUploadError,
    className,
    showFolderSelector = true
}: FileUploadProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [files, setFiles] = useState<UploadFile[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [selectedFolderId, setSelectedFolderId] = useState<string | null>(folderId);
    const [editingNameId, setEditingNameId] = useState<string | null>(null);
    const [tempName, setTempName] = useState<string>('');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const dragCounter = useRef(0);

    const maxFileSize = userPlan === 'FREE' ? FREE_MAX_FILE_SIZE_BYTES : PRO_MAX_FILE_SIZE_BYTES;

    // Sync selectedFolderId with folderId prop when it changes
    useEffect(() => {
        setSelectedFolderId(folderId);
    }, [folderId]);

    const handleDragEnter = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        dragCounter.current++;
        if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
            setIsDragging(true);
        }
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        dragCounter.current--;
        if (dragCounter.current === 0) {
            setIsDragging(false);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        dragCounter.current = 0;

        const droppedFiles = Array.from(e.dataTransfer.files);
        handleFileSelection(droppedFiles);
    };

    const handleFileSelection = (selectedFiles: File[]) => {
        if (files.length + selectedFiles.length > maxFiles) {
            toast.error(`Cannot upload more than ${maxFiles} files at once`);
            return;
        }

        const validFiles: UploadFile[] = [];
        const invalidFiles: string[] = [];

        selectedFiles.forEach((file) => {
            // Check file type
            if (!isAllowedFile(file)) {
                invalidFiles.push(`${file.name}: File type not supported`);
                return;
            }

            // Check file size
            if (file.size > maxFileSize) {
                const limit = userPlan === 'FREE' ? '50MB' : '5GB';
                invalidFiles.push(`${file.name}: Exceeds ${limit} size limit`);
                return;
            }

            validFiles.push({
                id: Math.random().toString(36).substring(2, 11),
                file,
                originalName: file.name,
                currentName: file.name,
                progress: 0,
                status: 'pending'
            });
        });

        if (invalidFiles.length > 0) {
            toast.error('Some files were rejected', {
                description: invalidFiles.join('\n')
            });
        }

        if (validFiles.length > 0) {
            setFiles(prev => [...prev, ...validFiles]);
            toast.success(`Added ${validFiles.length} file(s) to upload queue`, {
                description: validFiles.map(f => f.originalName).join(', ')
            });
        }
    };

    const removeFile = (id: string) => {
        const removedFile = files.find(f => f.id === id);
        setFiles(prev => prev.filter(file => file.id !== id));
        if (removedFile) {
            toast.info(`Removed "${removedFile.currentName}" from upload queue`);
        }
    };

    const getAuthParams = async (): Promise<ImageKitAuthParams> => {
        const response = await axios.get<APIResponse<ImageKitAuthParams>>('/api/imagekit/auth');
        if (!response.data.success || !response.data.payload) {
            throw new Error('Failed to get authentication parameters');
        }
        return response.data.payload;
    };

    const uploadToImageKit = async (
        file: File,
        authParams: ImageKitAuthParams,
        onProgress?: (progress: number) => void
    ): Promise<any> => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('fileName', file.name);
        formData.append('publicKey', process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY!);
        formData.append('signature', authParams.signature);
        formData.append('expire', authParams.expire.toString());
        formData.append('token', authParams.token);

        const response = await axios.post('https://upload.imagekit.io/api/v1/files/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
            onUploadProgress: (progressEvent) => {
                if (progressEvent.total) {
                    const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    onProgress?.(progress);
                }
            },
        });

        return response.data;
    };

    const startRenaming = (uploadFile: UploadFile) => {
        setEditingNameId(uploadFile.id);
        setTempName(uploadFile.currentName);
        setFiles(prev => prev.map(f =>
            f.id === uploadFile.id ? { ...f, isRenaming: true } : f
        ));
    };

    const cancelRenaming = () => {
        setEditingNameId(null);
        setTempName('');
        setFiles(prev => prev.map(f => ({ ...f, isRenaming: false })));
    };

    const saveRename = (uploadFileId: string) => {
        if (!tempName.trim()) {
            toast.error('File name cannot be empty');
            return;
        }

        const file = files.find(f => f.id === uploadFileId);
        const oldName = file?.currentName;

        const wasNameConflict = files.find(f => f.id === uploadFileId)?.status === 'name-conflict';

        setFiles(prev => prev.map(f =>
            f.id === uploadFileId
                ? {
                    ...f,
                    currentName: tempName.trim(),
                    isRenaming: false,
                    status: f.status === 'name-conflict' ? 'pending' : f.status
                }
                : f
        ));

        if (wasNameConflict) {
            toast.success(`Resolved name conflict - "${tempName.trim()}" is ready for upload`);
        }
        setEditingNameId(null);
        setTempName('');

        if (oldName && oldName !== tempName.trim()) {
            toast.success(`Renamed "${oldName}" to "${tempName.trim()}"`);
        }
    };

    const saveFileDetails = async (imagekitResponse: any, file: File, fileName: string): Promise<FileResponse> => {
        // Convert ImageKit's lowercase fileType to our uppercase enum
        const mappedFileType = mapFileType(imagekitResponse.fileType);

        if (!mappedFileType) {
            throw new Error(`Unsupported file type: ${imagekitResponse.fileType}`);
        }

        const payload = {
            name: fileName,
            size: file.size,
            fileType: mappedFileType,
            imagekitFileId: imagekitResponse.fileId,
            fileUrl: imagekitResponse.url,
            folderId: selectedFolderId
        };

        const response = await axios.post<APIResponse<FileResponse>>('/api/imagekit/upload', payload);

        if (!response.data.success || !response.data.payload) {
            throw new Error(response.data.message || 'Failed to save file details');
        }

        return response.data.payload;
    };

    const uploadSingleFile = async (uploadFile: UploadFile) => {
        try {
            // Update status to uploading
            setFiles(prev => prev.map(f =>
                f.id === uploadFile.id ? { ...f, status: 'uploading', progress: 0 } : f
            ));

            // Get auth params
            const authParams = await getAuthParams();

            // Upload to ImageKit with progress tracking
            const imagekitResponse = await uploadToImageKit(
                uploadFile.file,
                authParams,
                (progress) => {
                    setFiles(prev => prev.map(f =>
                        f.id === uploadFile.id ? { ...f, progress } : f
                    ));
                }
            );

            // Save file details to our database using current name
            const fileResponse = await saveFileDetails(imagekitResponse, uploadFile.file, uploadFile.currentName);

            // Update status to success
            setFiles(prev => prev.map(f =>
                f.id === uploadFile.id
                    ? { ...f, status: 'success', progress: 100, response: fileResponse }
                    : f
            ));

            return fileResponse;
        } catch (error: any) {
            console.error('Upload failed:', error);
            const errorMessage = error.response?.data?.message || error.message || 'Upload failed';
            const isNameConflict = error.response?.status === 409;

            // Update status to name-conflict or error
            setFiles(prev => prev.map(f =>
                f.id === uploadFile.id
                    ? {
                        ...f,
                        status: isNameConflict ? 'name-conflict' : 'error',
                        error: errorMessage
                    }
                    : f
            ));

            // Auto-start renaming for name conflicts
            if (isNameConflict) {
                setTimeout(() => {
                    startRenaming(uploadFile);
                    toast.warning(`Name conflict detected for "${uploadFile.currentName}"`, {
                        description: 'Please choose a different name to continue upload'
                    });
                }, 100);
            }

            throw error;
        }
    };

    const uploadAllFiles = async () => {
        if (files.length === 0) return;

        const pendingFiles = files.filter(f => f.status === 'pending');
        if (pendingFiles.length === 0) {
            toast.info('No files pending upload');
            return;
        }

        setIsUploading(true);
        toast.info(`Starting upload of ${pendingFiles.length} file(s)...`);

        try {
            const uploadPromises = pendingFiles.map(uploadSingleFile);
            const results = await Promise.allSettled(uploadPromises);

            const successfulUploads = results
                .filter((result): result is PromiseFulfilledResult<FileResponse> =>
                    result.status === 'fulfilled'
                )
                .map(result => result.value);

            const failedUploads = results.filter(result => result.status === 'rejected');

            if (successfulUploads.length > 0) {
                toast.success(`Successfully uploaded ${successfulUploads.length} file(s)`);
                onUploadSuccess?.(successfulUploads);
            }

            if (failedUploads.length > 0) {
                toast.error(`Failed to upload ${failedUploads.length} file(s)`);
                onUploadError?.(`${failedUploads.length} files failed to upload`);
            }
        } catch (error) {
            console.error('Batch upload failed:', error);
            toast.error('Upload process failed');
            onUploadError?.('Upload process failed');
        } finally {
            setIsUploading(false);
        }
    };

    const clearAll = () => {
        const fileCount = files.length;
        setFiles([]);
        if (fileCount > 0) {
            toast.info(`Cleared ${fileCount} file(s) from upload queue`);
        }
    };

    const retryFile = (file: UploadFile) => {
        if (file.status === 'name-conflict') {
            startRenaming(file);
            toast.info(`Please rename "${file.currentName}" to resolve conflict`);
        } else {
            setFiles(prev => prev.map(f =>
                f.id === file.id ? { ...f, status: 'pending', error: undefined } : f
            ));
            toast.info(`Retrying upload for "${file.currentName}"`);
        }
    };

    const successCount = files.filter(f => f.status === 'success').length;
    const errorCount = files.filter(f => f.status === 'error').length;
    const nameConflictCount = files.filter(f => f.status === 'name-conflict').length;
    const pendingCount = files.filter(f => f.status === 'pending').length;
    const uploadingCount = files.filter(f => f.status === 'uploading').length;

    return (
        <div className={cn("w-full space-y-6", className)}>
            {/* Folder Selector */}
            {showFolderSelector && (
                <FolderBrowser
                    selectedFolderId={selectedFolderId}
                    onFolderSelect={(folderId) => setSelectedFolderId(folderId)}
                />
            )}

            {/* File Upload Area */}
            <Card
                className={cn(
                    "relative transition-all duration-300 border-2",
                    isDragging
                        ? "border-blue-400 bg-blue-50/50 dark:bg-blue-900/10 shadow-md"
                        : "border-dashed border-muted-foreground/25 hover:border-muted-foreground/40 hover:shadow-md"
                )}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
            >
                <CardContent className="p-8">
                    <div className="flex flex-col items-center text-center space-y-4">
                        <div className={cn(
                            "p-3 rounded-full flex items-center justify-center transition-all duration-300",
                            isDragging
                                ? "bg-blue-100 dark:bg-blue-900/20"
                                : "bg-muted/50"
                        )}>
                            <Upload className={cn(
                                "w-6 h-6 transition-colors",
                                isDragging ? "text-blue-600 dark:text-blue-400" : "text-muted-foreground"
                            )} />
                        </div>

                        <div className="space-y-2">
                            <h3 className={cn(
                                "text-lg font-semibold transition-colors",
                                isDragging ? "text-blue-700 dark:text-blue-300" : "text-foreground"
                            )}>
                                {isDragging ? "Drop files here!" : "Upload your files"}
                            </h3>

                            <p className="text-muted-foreground text-sm">
                                {isDragging
                                    ? "Release to start uploading"
                                    : "Drag and drop files here, or click to browse"
                                }
                            </p>
                        </div>

                        <Button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploading}
                        >
                            <CloudUpload className="w-4 h-4 mr-2" />
                            Choose Files
                        </Button>

                        <input
                            type="file"
                            ref={fileInputRef}
                            multiple
                            className="hidden"
                            onChange={(e) => {
                                const selectedFiles = Array.from(e.target.files || []);
                                handleFileSelection(selectedFiles);
                                e.target.value = ''; // Reset input
                            }}
                        />

                        <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-3 text-base text-muted-foreground pt-3 border-t border-muted-foreground/10">
                            <div className="flex items-center justify-center space-x-2">
                                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                                <span>Max {maxFiles} files</span>
                            </div>
                            <div className="flex items-center justify-center space-x-2">
                                <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                                <span>Up to {userPlan === 'FREE' ? '50MB' : '5GB'}</span>
                            </div>
                            <div className="flex items-center justify-center space-x-2">
                                <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                                <span>Images, videos, docs, PDFs</span>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* File List */}
            {files.length > 0 && (
                <Card className="transition-all duration-300 hover:shadow-md">
                    <CardContent className="p-6">
                        {/* Header with stats */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 space-y-4 sm:space-y-0">
                            <div className="space-y-2">
                                <h4 className="text-lg font-semibold">Files Ready for Upload</h4>
                                <div className="flex flex-wrap gap-4 text-sm">
                                    {pendingCount > 0 && (
                                        <span className="flex items-center space-x-1 text-blue-600 dark:text-blue-400">
                                            <CloudUpload className="w-3 h-3" />
                                            <span>{pendingCount} pending</span>
                                        </span>
                                    )}
                                    {uploadingCount > 0 && (
                                        <span className="flex items-center space-x-1 text-purple-600 dark:text-purple-400">
                                            <Loader2 className="w-3 h-3 animate-spin" />
                                            <span>{uploadingCount} uploading</span>
                                        </span>
                                    )}
                                    {successCount > 0 && (
                                        <span className="flex items-center space-x-1 text-green-600 dark:text-green-400">
                                            <FileCheck className="w-3 h-3" />
                                            <span>{successCount} completed</span>
                                        </span>
                                    )}
                                    {errorCount > 0 && (
                                        <span className="flex items-center space-x-1 text-red-600 dark:text-red-400">
                                            <FileX className="w-3 h-3" />
                                            <span>{errorCount} failed</span>
                                        </span>
                                    )}
                                    {nameConflictCount > 0 && (
                                        <span className="flex items-center space-x-1 text-orange-600 dark:text-orange-400">
                                            <AlertCircle className="w-3 h-3" />
                                            <span>{nameConflictCount} need rename</span>
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="flex space-x-3">
                                <Button
                                    onClick={clearAll}
                                    variant="outline"
                                    size="sm"
                                    disabled={isUploading}
                                    className="flex items-center space-x-2"
                                >
                                    <X className="w-4 h-4" />
                                    <span>Clear All</span>
                                </Button>
                                <Button
                                    onClick={uploadAllFiles}
                                    size="sm"
                                    disabled={isUploading || files.every(f => f.status !== 'pending')}
                                    className="flex items-center space-x-2"
                                >
                                    {isUploading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            <span>Uploading...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Upload className="w-4 h-4" />
                                            <span>Upload All</span>
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>

                        {/* File items */}
                        <div className="space-y-3 max-h-96 overflow-y-auto">
                            {files.map((uploadFile) => (
                                <div
                                    key={uploadFile.id}
                                    className={cn(
                                        "flex items-center space-x-4 p-4 rounded-lg border transition-all duration-200",
                                        uploadFile.status === 'success' && "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800",
                                        uploadFile.status === 'error' && "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800",
                                        uploadFile.status === 'name-conflict' && "bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800",
                                        uploadFile.status === 'uploading' && "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800",
                                        uploadFile.status === 'pending' && "bg-card border-border hover:bg-muted/30"
                                    )}
                                >
                                    {/* File icon with status overlay */}
                                    <div className="relative flex-shrink-0">
                                        <div className="w-10 h-10 bg-muted/50 rounded-lg flex items-center justify-center">
                                            {getFileIcon(uploadFile.originalName)}
                                        </div>
                                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-background rounded-full flex items-center justify-center border-2 border-background">
                                            {getStatusIcon(uploadFile.status)}
                                        </div>
                                    </div>

                                    {/* File details */}
                                    <div className="flex-1 min-w-0">
                                        {uploadFile.isRenaming ? (
                                            <div className="space-y-2">
                                                <input
                                                    type="text"
                                                    value={tempName}
                                                    onChange={(e) => setTempName(e.target.value)}
                                                    className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-primary"
                                                    placeholder="Enter new file name"
                                                    autoFocus
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                            saveRename(uploadFile.id);
                                                        } else if (e.key === 'Escape') {
                                                            cancelRenaming();
                                                        }
                                                    }}
                                                />
                                                <div className="flex space-x-2">
                                                    <Button
                                                        size="sm"
                                                        onClick={() => saveRename(uploadFile.id)}
                                                        className="h-6 px-2 text-xs"
                                                    >
                                                        Save
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={cancelRenaming}
                                                        className="h-6 px-2 text-xs"
                                                    >
                                                        Cancel
                                                    </Button>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <p className="text-sm font-medium truncate">
                                                    {uploadFile.currentName}
                                                    {uploadFile.currentName !== uploadFile.originalName && (
                                                        <span className="ml-2 text-xs text-muted-foreground">
                                                            (renamed from {uploadFile.originalName})
                                                        </span>
                                                    )}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {formatFileSize(uploadFile.file.size)}
                                                </p>
                                            </>
                                        )}

                                        {/* Progress bar */}
                                        {uploadFile.status === 'uploading' && (
                                            <div className="mt-2">
                                                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                                                    <span>Uploading...</span>
                                                    <span>{uploadFile.progress}%</span>
                                                </div>
                                                <div className="w-full bg-muted rounded-full h-2">
                                                    <div
                                                        className="bg-primary h-2 rounded-full transition-all duration-300"
                                                        style={{ width: `${uploadFile.progress}%` }}
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        {/* Error message */}
                                        {uploadFile.status === 'error' && (
                                            <div className="mt-2 flex items-center space-x-2">
                                                <AlertCircle className="w-3 h-3 text-red-500 flex-shrink-0" />
                                                <p className="text-xs text-red-600 dark:text-red-400">
                                                    {uploadFile.error}
                                                </p>
                                            </div>
                                        )}

                                        {/* Name conflict message */}
                                        {uploadFile.status === 'name-conflict' && (
                                            <div className="mt-2 flex items-center space-x-2">
                                                <AlertCircle className="w-3 h-3 text-orange-500 flex-shrink-0" />
                                                <p className="text-xs text-orange-600 dark:text-orange-400">
                                                    A file with this name already exists. Please rename the file.
                                                </p>
                                            </div>
                                        )}

                                        {/* Success message */}
                                        {uploadFile.status === 'success' && (
                                            <div className="mt-2 flex items-center space-x-2">
                                                <Check className="w-3 h-3 text-green-500" />
                                                <p className="text-xs text-green-600 dark:text-green-400">
                                                    Upload successful
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Action buttons */}
                                    <div className="flex items-center space-x-2 flex-shrink-0">
                                        {!uploadFile.isRenaming && uploadFile.status !== 'uploading' && uploadFile.status !== 'success' && (
                                            <Button
                                                onClick={() => startRenaming(uploadFile)}
                                                size="sm"
                                                variant="outline"
                                                disabled={isUploading}
                                                className="h-8 w-8 p-0"
                                                title="Rename file"
                                            >
                                                <Edit3 className="w-3 h-3" />
                                            </Button>
                                        )}
                                        {(uploadFile.status === 'error' || uploadFile.status === 'name-conflict') && !uploadFile.isRenaming && (
                                            <Button
                                                onClick={() => retryFile(uploadFile)}
                                                size="sm"
                                                variant="outline"
                                                disabled={isUploading}
                                                className="h-8 w-8 p-0"
                                                title={uploadFile.status === 'name-conflict' ? 'Rename and retry' : 'Retry upload'}
                                            >
                                                <RotateCcw className="w-3 h-3" />
                                            </Button>
                                        )}
                                        <Button
                                            onClick={() => removeFile(uploadFile.id)}
                                            size="sm"
                                            variant="ghost"
                                            disabled={uploadFile.status === 'uploading'}
                                            className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/20"
                                            title="Remove file"
                                        >
                                            <X className="w-3 h-3" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
} 