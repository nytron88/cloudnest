'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileUpload, UploadDialog } from './';
import { File as FileResponse } from '@/types/file';
import { toast } from 'sonner';
import { CloudUpload, FileCheck, Settings, Sparkles } from 'lucide-react';

export function FileUploadDemo() {
    const [uploadedFiles, setUploadedFiles] = useState<FileResponse[]>([]);

    const handleUploadSuccess = (files: FileResponse[]) => {
        setUploadedFiles(prev => [...prev, ...files]);
        toast.success(`Successfully uploaded ${files.length} file(s)`, {
            description: "Your files are now available in your CloudNest storage",
        });
    };

    const handleUploadError = (error: string) => {
        toast.error('Upload failed', {
            description: error,
        });
    };

    return (
        <div className="min-h-screen bg-background p-6">
            <div className="max-w-6xl mx-auto space-y-8">
                {/* Header */}
                <div className="text-center space-y-4">
                    <div className="flex items-center justify-center space-x-3">
                        <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-full">
                            <CloudUpload className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <h1 className="text-4xl font-bold text-foreground">
                            Upload Components Demo
                        </h1>
                    </div>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                        Experience our modern file upload system with drag & drop support,
                        real-time progress tracking, and seamless cloud storage integration.
                    </p>
                </div>

                {/* Upload Dialog Demo */}
                <Card className="transition-all duration-300 hover:shadow-md">
                    <CardHeader className="bg-blue-50/50 dark:bg-blue-900/10 border-b">
                        <div className="flex items-center space-x-3">
                            <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                                <Settings className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <CardTitle className="text-xl">Upload Dialog Component</CardTitle>
                                <CardDescription>
                                    Modal-based upload experience with modern design
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-8">
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <h4 className="font-medium text-foreground">Features</h4>
                                    <ul className="space-y-2 text-sm text-muted-foreground">
                                        <li className="flex items-center space-x-2">
                                            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                                            <span>Drag & drop support</span>
                                        </li>
                                        <li className="flex items-center space-x-2">
                                            <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                                            <span>Real-time progress tracking</span>
                                        </li>
                                        <li className="flex items-center space-x-2">
                                            <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                                            <span>Folder navigation</span>
                                        </li>
                                        <li className="flex items-center space-x-2">
                                            <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
                                            <span>File type validation</span>
                                        </li>
                                    </ul>
                                </div>
                                <div className="space-y-3">
                                    <h4 className="font-medium text-foreground">Supported Plans</h4>
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                                            <span className="text-sm font-medium">Free Plan</span>
                                            <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded">Up to 50MB</span>
                                        </div>
                                        <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                                            <span className="text-sm font-medium">Pro Plan</span>
                                            <span className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-2 py-1 rounded">Up to 5GB</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-center pt-4 border-t border-muted-foreground/10">
                                <UploadDialog
                                    userPlan="FREE"
                                    onUploadSuccess={handleUploadSuccess}
                                    trigger={
                                        <Button size="lg" className="transition-all duration-200 hover:shadow-md">
                                            <CloudUpload className="w-5 h-5 mr-2" />
                                            Try Upload Dialog
                                        </Button>
                                    }
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Inline Upload Demo */}
                <Card className="transition-all duration-300 hover:shadow-md">
                    <CardHeader className="bg-green-50/50 dark:bg-green-900/10 border-b">
                        <div className="flex items-center space-x-3">
                            <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                                <Sparkles className="w-4 h-4 text-green-600 dark:text-green-400" />
                            </div>
                            <div>
                                <CardTitle className="text-xl">Inline Upload Component</CardTitle>
                                <CardDescription>
                                    Embedded upload experience with enhanced folder navigation
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-8">
                        <FileUpload
                            userPlan="PRO_MONTHLY"
                            maxFiles={8}
                            onUploadSuccess={handleUploadSuccess}
                            onUploadError={handleUploadError}
                            showFolderSelector={true}
                        />
                    </CardContent>
                </Card>

                {/* Recently Uploaded Files */}
                {uploadedFiles.length > 0 && (
                    <Card className="transition-all duration-300 hover:shadow-md">
                        <CardHeader className="bg-emerald-50/50 dark:bg-emerald-900/10 border-b">
                            <div className="flex items-center space-x-3">
                                <div className="p-2 bg-emerald-100 dark:bg-emerald-900/20 rounded-lg">
                                    <FileCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                </div>
                                <div>
                                    <CardTitle className="text-xl">Upload History</CardTitle>
                                    <CardDescription>
                                        {uploadedFiles.length} file(s) successfully uploaded
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="grid gap-4 max-h-80 overflow-y-auto">
                                {uploadedFiles.map((file, index) => (
                                    <div
                                        key={`${file.imagekitFileId || file.name}-${index}`}
                                        className="flex items-center justify-between p-4 bg-green-50/50 dark:bg-green-900/10 border border-green-200/50 dark:border-green-800/30 rounded-lg hover:shadow-sm transition-all duration-200"
                                    >
                                        <div className="flex items-center space-x-4">
                                            <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                                                <FileCheck className="w-5 h-5 text-green-600 dark:text-green-400" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-foreground">{file.name}</p>
                                                <div className="flex items-center space-x-3 text-xs text-muted-foreground">
                                                    <span>{file.type}</span>
                                                    <span>•</span>
                                                    <span>{file.size} bytes</span>
                                                    <span>•</span>
                                                    <span className="text-green-600 dark:text-green-400 font-medium">
                                                        Uploaded successfully
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => window.open(file.fileUrl, '_blank')}
                                            className="hover:bg-green-50 hover:text-green-700 hover:border-green-300 dark:hover:bg-green-900/20 dark:hover:text-green-300 dark:hover:border-green-700 transition-colors"
                                        >
                                            View File
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
} 