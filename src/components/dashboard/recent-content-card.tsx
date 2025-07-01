import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
    Calendar, 
    FileText, 
    Folder, 
    Star, 
    Upload,
    File,
    Image,
    Video,
    Music,
    Archive
} from "lucide-react";
import { CombinedContentItem } from '@/types/folder';
import { formatFileSize, formatDate } from '@/lib/utils/dashboard-helpers';

interface RecentContentCardProps {
    recentContent: CombinedContentItem[];
}

const getFileIcon = (fileType: string) => {
    const type = fileType.toLowerCase();
    if (type.includes('image')) return Image;
    if (type.includes('video')) return Video;
    if (type.includes('audio')) return Music;
    if (type.includes('zip') || type.includes('rar') || type.includes('7z')) return Archive;
    return File;
};

export function RecentContentCard({ recentContent }: RecentContentCardProps) {
    return (
        <Card className="mb-8 transition-all duration-300 hover:shadow-md">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Recent Content
                </CardTitle>
                <CardDescription>
                    Your recently uploaded files and created folders
                </CardDescription>
            </CardHeader>
            <CardContent>
                {recentContent.length > 0 ? (
                    <div className="space-y-3">
                        {recentContent.map((item) => {
                            const Icon = item.type === 'folder' ? Folder : getFileIcon(item.fileType || '');
                            return (
                                <div key={item.id} className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-all duration-200 cursor-pointer">
                                    <Icon className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <p className="font-medium truncate">{item.name}</p>
                                            {item.isStarred && <Star className="h-4 w-4 text-amber-500 fill-current" />}
                                        </div>
                                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                            <span>
                                                {item.type === 'folder' ? 'Folder' : `File • ${formatFileSize(item.size || 0)}`}
                                            </span>
                                            <span>{formatDate(item.updatedAt)}</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                        <p className="text-muted-foreground mb-4 text-lg">No files or folders yet</p>
                        <p className="text-sm text-muted-foreground mb-6">Start organizing your files in the cloud</p>
                        <Button size="lg" className="transition-all duration-200 hover:scale-105">
                            <Upload className="h-4 w-4 mr-2" />
                            Upload Your First File
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
} 