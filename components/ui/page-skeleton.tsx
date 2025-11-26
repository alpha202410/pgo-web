'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { TablePageSkeleton, TableColumnSkeleton } from './table-skeleton';

interface PageSkeletonProps {
    /** Show header section skeleton */
    showHeader?: boolean;
    /** Header title width */
    headerTitleWidth?: string;
    /** Show filter section skeleton */
    showFilters?: boolean;
    /** Number of filter items */
    filterCount?: number;
    /** Show table skeleton */
    showTable?: boolean;
    /** Table column definitions */
    tableColumns?: TableColumnSkeleton[];
    /** Number of table rows */
    tableRows?: number;
    /** Show pagination */
    showPagination?: boolean;
    /** Custom content to render before table */
    children?: React.ReactNode;
    /** Container className */
    className?: string;
}

/**
 * Generic page skeleton wrapper
 * Can be used for any page that needs loading state
 */
export function PageSkeleton({
    showHeader = false,
    headerTitleWidth = '200px',
    showFilters = false,
    filterCount = 3,
    showTable = true,
    tableColumns,
    tableRows = 10,
    showPagination = true,
    children,
    className,
}: PageSkeletonProps) {
    return (
        <div className={`flex flex-1 flex-col ${className || ''}`}>
            {showHeader && (
                <div className="px-4 lg:px-6 py-4 border-b">
                    <Skeleton className="h-8" style={{ width: headerTitleWidth }} />
                </div>
            )}

            {showFilters && (
                <div className="flex items-center justify-end gap-3 px-4 lg:px-6 py-4">
                    {Array.from({ length: filterCount }).map((_, index) => (
                        <Skeleton
                            key={index}
                            className="h-8"
                            style={{
                                width: index === filterCount - 1 ? '180px' : index === 0 ? '100px' : '130px',
                            }}
                        />
                    ))}
                </div>
            )}

            {children}

            {showTable && tableColumns && (
                <div className="px-4 lg:px-6 py-2">
                    <TablePageSkeleton
                        rows={tableRows}
                        columns={tableColumns}
                        filterButtons={0}
                        showPagination={showPagination}
                    />
                </div>
            )}
        </div>
    );
}

/**
 * Summary cards skeleton for dashboard/report sections
 */
interface SummaryCardsSkeletonProps {
    /** Number of cards */
    cardCount?: number;
    /** Card layout (grid columns) */
    columns?: number;
}

export function SummaryCardsSkeleton({
    cardCount = 4,
    columns = 4,
}: SummaryCardsSkeletonProps) {
    const gridCols = {
        1: 'grid-cols-1',
        2: 'grid-cols-1 @xl/main:grid-cols-2',
        3: 'grid-cols-1 @xl/main:grid-cols-2 @3xl/main:grid-cols-3',
        4: 'grid-cols-1 @xl/main:grid-cols-2 @3xl/main:grid-cols-4',
    }[columns] || 'grid-cols-1 @xl/main:grid-cols-2 @3xl/main:grid-cols-4';

    return (
        <div className={`*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 ${gridCols}`}>
            {Array.from({ length: cardCount }).map((_, index) => (
                <div
                    key={index}
                    className="rounded-xl border bg-card p-6 shadow-sm"
                >
                    <div className="space-y-3">
                        <Skeleton className="h-4 w-[120px]" />
                        <Skeleton className="h-8 w-[80px]" />
                    </div>
                </div>
            ))}
        </div>
    );
}



