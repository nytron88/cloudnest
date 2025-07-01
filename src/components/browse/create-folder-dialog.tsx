'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import axios from 'axios';
import { APIResponse } from '@/types/apiResponse';
import { Folder } from '@/types/folder';

interface CreateFolderDialogProps {
    isOpen: boolean;
    onClose: () => void;
    parentId: string | null;
    onSuccess: () => void;
}

export function CreateFolderDialog({ isOpen, onClose, parentId, onSuccess }: CreateFolderDialogProps) {
    const [folderName, setFolderName] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!folderName.trim()) {
            toast.error('Please enter a folder name');
            return;
        }

        setIsCreating(true);
        
        try {
            const response = await axios.post<APIResponse<Folder>>('/api/folder', {
                name: folderName.trim(),
                parentId: parentId
            });

            if (response.data.success) {
                toast.success('Folder created successfully');
                setFolderName('');
                onClose();
                onSuccess();
            } else {
                toast.error('Failed to create folder', {
                    description: response.data.message
                });
            }
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || 'Failed to create folder';
            if (error.response?.status === 409) {
                toast.error('A folder with this name already exists');
            } else {
                toast.error('Failed to create folder', {
                    description: errorMessage
                });
            }
        } finally {
            setIsCreating(false);
        }
    };

    const handleClose = () => {
        if (!isCreating) {
            setFolderName('');
            onClose();
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Create New Folder</DialogTitle>
                    <DialogDescription>
                        Enter a name for your new folder
                    </DialogDescription>
                </DialogHeader>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <Input
                            placeholder="Folder name"
                            value={folderName}
                            onChange={(e) => setFolderName(e.target.value)}
                            disabled={isCreating}
                            autoFocus
                        />
                    </div>
                    
                    <div className="flex justify-end gap-2">
                        <Button 
                            type="button" 
                            variant="outline" 
                            onClick={handleClose}
                            disabled={isCreating}
                        >
                            Cancel
                        </Button>
                        <Button 
                            type="submit" 
                            disabled={isCreating || !folderName.trim()}
                        >
                            {isCreating ? 'Creating...' : 'Create Folder'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
} 