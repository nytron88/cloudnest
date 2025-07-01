'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Upload } from 'lucide-react';
import { toast } from 'sonner';
import { FileUpload } from './file-upload';
import { File as FileResponse } from '@/types/file';

interface UploadDialogProps {
    /** Selected folder ID to upload files to */
    folderId?: string | null;
    /** User's subscription plan */
    userPlan?: 'FREE' | 'PRO_MONTHLY' | 'PRO_YEARLY';
    /** Callback when files are successfully uploaded */
    onUploadSuccess?: (files: FileResponse[]) => void;
    /** Custom trigger element */
    trigger?: React.ReactNode;
    /** Dialog title */
    title?: string;
    /** Dialog description */
    description?: string;
}

export function UploadDialog({
    folderId,
    userPlan = 'FREE',
    onUploadSuccess,
    trigger,
    title = 'Upload Files',
    description = 'Drag and drop files or browse to upload to your CloudNest storage'
}: UploadDialogProps) {
    const [open, setOpen] = useState(false);

    const handleUploadSuccess = (files: FileResponse[]) => {
        onUploadSuccess?.(files);
        setOpen(false);
        toast.success('Upload completed!', {
            description: `${files.length} file(s) uploaded successfully`
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button className="flex items-center space-x-2">
                        <Upload className="w-4 h-4" />
                        <span>Upload Files</span>
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="max-w-5xl lg:max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
                <DialogHeader className="flex-shrink-0 text-center">
                    <DialogTitle className="text-xl font-semibold">
                        {title}
                    </DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                        {description}
                    </DialogDescription>
                </DialogHeader>
                <div className="flex-1 overflow-auto">
                    <FileUpload
                        folderId={folderId}
                        userPlan={userPlan}
                        onUploadSuccess={handleUploadSuccess}
                        showFolderSelector={!folderId} // Hide folder selector if specific folder is provided
                    />
                </div>
            </DialogContent>
        </Dialog>
    );
} 