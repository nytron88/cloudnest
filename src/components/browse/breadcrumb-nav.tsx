'use client';

import { ChevronRight, Home, Folder } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CombinedContentItem } from '@/types/folder';
import { cn } from '@/lib/utils/utils';

interface BreadcrumbItem {
    id: string | null;
    name: string;
    path: string;
}

interface BreadcrumbNavProps {
    currentPath: BreadcrumbItem[];
    onNavigate: (folderId: string | null) => void;
    className?: string;
}

export function BreadcrumbNav({ currentPath, onNavigate, className }: BreadcrumbNavProps) {
    return (
        <nav className={cn("flex items-center space-x-1 text-sm text-muted-foreground", className)}>
            {currentPath.map((item, index) => (
                <div key={item.id || 'root'} className="flex items-center">
                    {index > 0 && <ChevronRight className="h-4 w-4 mx-1" />}
                    
                    <Button
                        variant="ghost"
                        size="sm"
                        className={cn(
                            "h-8 px-2 text-sm font-medium transition-colors",
                            index === currentPath.length - 1
                                ? "text-foreground cursor-default hover:bg-transparent"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                        onClick={() => index < currentPath.length - 1 && onNavigate(item.id)}
                        disabled={index === currentPath.length - 1}
                    >
                        {index === 0 ? (
                            <div className="flex items-center gap-1">
                                <Home className="h-3 w-3" />
                                <span>{item.name}</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-1">
                                <Folder className="h-3 w-3" />
                                <span className="max-w-[100px] truncate">{item.name}</span>
                            </div>
                        )}
                    </Button>
                </div>
            ))}
        </nav>
    );
} 