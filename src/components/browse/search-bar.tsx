'use client';

import { useState } from 'react';
import { Search, Filter, X, Star, Trash2, Grid, List } from 'lucide-react';
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
    onViewModeChange
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
        return `${labels[sortBy]} (${order === 'asc' ? 'A-Z' : 'Z-A'})`;
    };

    const hasActiveFilters = showStarred || showTrash || searchTerm;

    return (
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between bg-card p-4 rounded-lg border">
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
                            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                            onClick={clearSearch}
                        >
                            <X className="h-3 w-3" />
                        </Button>
                    )}
                </div>
            </form>

            {/* Controls */}
            <div className="flex items-center gap-2">
                {/* Filter Menu */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="gap-2">
                            <Filter className={cn("h-4 w-4", hasActiveFilters && "text-blue-600")} />
                            Filter
                            {hasActiveFilters && (
                                <span className="bg-blue-600 text-white text-xs rounded-full w-2 h-2"></span>
                            )}
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuLabel>View Options</DropdownMenuLabel>
                        <DropdownMenuItem onClick={onStarredToggle}>
                            <Star className={cn("h-4 w-4 mr-2", showStarred && "fill-current text-amber-500")} />
                            Starred only
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={onTrashToggle}>
                            <Trash2 className={cn("h-4 w-4 mr-2", showTrash && "text-destructive")} />
                            Trash
                        </DropdownMenuItem>
                        
                        <DropdownMenuSeparator />
                        <DropdownMenuLabel>Sort by</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => onSortChange('name')}>
                            Name {sortBy === 'name' && `(${order === 'asc' ? 'A-Z' : 'Z-A'})`}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onSortChange('updatedAt')}>
                            Modified {sortBy === 'updatedAt' && `(${order === 'asc' ? 'Old-New' : 'New-Old'})`}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onSortChange('createdAt')}>
                            Created {sortBy === 'createdAt' && `(${order === 'asc' ? 'Old-New' : 'New-Old'})`}
                        </DropdownMenuItem>
                        
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => onOrderChange(order === 'asc' ? 'desc' : 'asc')}>
                            Reverse order
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

                {/* Sort Display */}
                <Button variant="outline" size="sm" className="hidden sm:flex gap-2">
                    <span className="text-sm text-muted-foreground">Sort:</span>
                    <span className="text-sm font-medium">{getSortLabel()}</span>
                </Button>

                {/* View Mode Toggle */}
                <div className="flex border rounded-md">
                    <Button
                        variant={viewMode === 'grid' ? 'default' : 'ghost'}
                        size="sm"
                        className="rounded-r-none"
                        onClick={() => onViewModeChange('grid')}
                    >
                        <Grid className="h-4 w-4" />
                    </Button>
                    <Button
                        variant={viewMode === 'list' ? 'default' : 'ghost'}
                        size="sm"
                        className="rounded-l-none"
                        onClick={() => onViewModeChange('list')}
                    >
                        <List className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Active Filters Display */}
            {hasActiveFilters && (
                <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                    {searchTerm && (
                        <div className="flex items-center gap-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 px-2 py-1 rounded text-sm">
                            <span>Search: "{searchTerm}"</span>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-4 w-4 p-0 text-blue-600 hover:text-blue-800"
                                onClick={clearSearch}
                            >
                                <X className="h-3 w-3" />
                            </Button>
                        </div>
                    )}
                    {showStarred && (
                        <div className="flex items-center gap-1 bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 px-2 py-1 rounded text-sm">
                            <Star className="h-3 w-3 fill-current" />
                            <span>Starred</span>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-4 w-4 p-0 text-amber-600 hover:text-amber-800"
                                onClick={onStarredToggle}
                            >
                                <X className="h-3 w-3" />
                            </Button>
                        </div>
                    )}
                    {showTrash && (
                        <div className="flex items-center gap-1 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 px-2 py-1 rounded text-sm">
                            <Trash2 className="h-3 w-3" />
                            <span>Trash</span>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-4 w-4 p-0 text-red-600 hover:text-red-800"
                                onClick={onTrashToggle}
                            >
                                <X className="h-3 w-3" />
                            </Button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
} 