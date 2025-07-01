'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/utils';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    className?: string;
}

export function Pagination({ currentPage, totalPages, onPageChange, className }: PaginationProps) {
    if (totalPages <= 1) return null;

    const getVisiblePages = () => {
        const pages = [];
        const showPages = 7; // Number of pages to show
        
        if (totalPages <= showPages) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            const start = Math.max(1, currentPage - Math.floor(showPages / 2));
            const end = Math.min(totalPages, start + showPages - 1);
            
            // Adjust start if we're near the end
            const adjustedStart = Math.max(1, end - showPages + 1);
            
            for (let i = adjustedStart; i <= end; i++) {
                pages.push(i);
            }
        }
        
        return pages;
    };

    const visiblePages = getVisiblePages();

    return (
        <nav className={cn("flex items-center justify-center gap-1", className)}>
            <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage <= 1}
                className="gap-1"
            >
                <ChevronLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Previous</span>
            </Button>

            <div className="flex gap-1">
                {visiblePages[0] > 1 && (
                    <>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onPageChange(1)}
                            className="w-9"
                        >
                            1
                        </Button>
                        {visiblePages[0] > 2 && (
                            <span className="flex items-center px-2 text-muted-foreground">...</span>
                        )}
                    </>
                )}

                {visiblePages.map((page) => (
                    <Button
                        key={page}
                        variant={page === currentPage ? "default" : "outline"}
                        size="sm"
                        onClick={() => onPageChange(page)}
                        className="w-9"
                    >
                        {page}
                    </Button>
                ))}

                {visiblePages[visiblePages.length - 1] < totalPages && (
                    <>
                        {visiblePages[visiblePages.length - 1] < totalPages - 1 && (
                            <span className="flex items-center px-2 text-muted-foreground">...</span>
                        )}
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onPageChange(totalPages)}
                            className="w-9"
                        >
                            {totalPages}
                        </Button>
                    </>
                )}
            </div>

            <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className="gap-1"
            >
                <span className="hidden sm:inline">Next</span>
                <ChevronRight className="h-4 w-4" />
            </Button>
        </nav>
    );
} 