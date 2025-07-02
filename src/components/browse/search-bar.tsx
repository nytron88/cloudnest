'use client';

import { useState } from 'react';
import { Search, Filter, X, Star, Trash2, Grid, List, SortAsc, SortDesc } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
    DropdownMenu, 
    DropdownMenuContent, 
    DropdownMenuItem, 
    DropdownMenuTrigger,
    DropdownMenuSeparator,
    DropdownMenuLabel
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils/utils';

interface SearchBarProps {
    searchTerm: string;
    onSearchChange: (term: string) => void;
    sortBy: 'name' | 'createdAt' | 'updatedAt';
    onSortChange: (sort: 'name' | 'createdAt' | 'updatedAt') => void;
    order: 'asc' | 'desc';
    onOrderChange: (order: 'asc' | 'desc') => void;
    showStarred: boolean;
    onStarredToggle: () => void;
    showTrash: boolean;
    onTrashToggle: () => void;
    viewMode: 'grid' | 'list';
    onViewModeChange: (mode: 'grid' | 'list') => void;
    hideFilters?: boolean;
}

export function SearchBar({
    searchTerm,
    onSearchChange,
    sortBy,
    onSortChange,
    order,
    onOrderChange,
    showStarred,
    onStarredToggle,
    showTrash,
    onTrashToggle,
    viewMode,
    onViewModeChange,
    hideFilters = false
}: SearchBarProps) {
    const [localSearch, setLocalSearch] = useState(searchTerm);

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSearchChange(localSearch);
    };

    const clearSearch = () => {
        setLocalSearch('');
        onSearchChange('');
    };

    const getSortLabel = () => {
        const labels = {
            name: 'Name',
            createdAt: 'Created',
            updatedAt: 'Modified'
        };
        return labels[sortBy];
    };

    const hasActiveFilters = showStarred || showTrash || searchTerm;

    return (
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            {/* Search Input */}
            <form onSubmit={handleSearchSubmit} className="flex-1 max-w-md">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search files and folders..."
                        value={localSearch}
                        onChange={(e) => setLocalSearch(e.target.value)}
                        className="pl-10 pr-10"
                    />
                    {localSearch && (
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 cursor-pointer"
                            onClick={clearSearch}
                        >
                            <X className="h-3 w-3" />
                        </Button>
                    )}
                </div>
            </form>

            {/* Controls */}
            <div className="flex items-center gap-2">
                {/* Sort Menu */}
                {!hideFilters && (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="gap-2 cursor-pointer">
                            {order === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
                            Sort: {getSortLabel()}
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuLabel>Sort by</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => onSortChange('name')} className="cursor-pointer">
                            Name {sortBy === 'name' && `(${order === 'asc' ? 'A-Z' : 'Z-A'})`}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onSortChange('updatedAt')} className="cursor-pointer">
                            Modified {sortBy === 'updatedAt' && `(${order === 'asc' ? 'Old-New' : 'New-Old'})`}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onSortChange('createdAt')} className="cursor-pointer">
                            Created {sortBy === 'createdAt' && `(${order === 'asc' ? 'Old-New' : 'New-Old'})`}
                        </DropdownMenuItem>
                        
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => onOrderChange(order === 'asc' ? 'desc' : 'asc')} className="cursor-pointer">
                            Reverse order
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
                )}

                {/* Filter Menu */}
                {!hideFilters && hasActiveFilters && (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="gap-2 cursor-pointer">
                            <Filter className="h-4 w-4 text-blue-600" />
                            Filter
                            <span className="bg-blue-600 text-white text-xs rounded-full w-2 h-2"></span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuLabel>View Options</DropdownMenuLabel>
                        <DropdownMenuItem onClick={onStarredToggle} className="cursor-pointer">
                            <Star className={cn("h-4 w-4 mr-2", showStarred && "fill-current text-amber-500")} />
                            Starred only
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={onTrashToggle} className="cursor-pointer">
                            <Trash2 className={cn("h-4 w-4 mr-2", showTrash && "text-destructive")} />
                            Trash
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
                )}

                {/* View Mode Toggle */}
                <div className="flex border rounded-md">
                    <Button
                        variant={viewMode === 'grid' ? 'default' : 'ghost'}
                        size="sm"
                        className="rounded-r-none px-3 cursor-pointer"
                        onClick={() => onViewModeChange('grid')}
                    >
                        <Grid className="h-4 w-4" />
                    </Button>
                    <Button
                        variant={viewMode === 'list' ? 'default' : 'ghost'}
                        size="sm"
                        className="rounded-l-none px-3 cursor-pointer"
                        onClick={() => onViewModeChange('list')}
                    >
                        <List className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Active Search Filter Display */}
            {searchTerm && (
                <div className="flex items-center gap-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 px-3 py-1.5 rounded-md text-sm w-full sm:w-auto">
                    <span>Search: "{searchTerm}"</span>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-4 w-4 p-0 text-blue-600 hover:text-blue-800 ml-1 cursor-pointer"
                        onClick={clearSearch}
                    >
                        <X className="h-3 w-3" />
                    </Button>
                </div>
            )}
        </div>
    );
} 