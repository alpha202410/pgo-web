'use client';

import { Skeleton } from '@/components/ui/skeleton';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

export interface TableColumnSkeleton {
    /** Width of the column (e.g., 'w-8', 'w-[140px]') */
    width?: string;
    /** Type of skeleton content */
    type?: 'text' | 'badge' | 'checkbox' | 'button' | 'text-multi' | 'amount';
    /** Number of text lines for text-multi type */
    lines?: number;
    /** Alignment */
    align?: 'left' | 'center' | 'right';
}

interface TableSkeletonProps {
    /** Number of skeleton rows to display */
    rows?: number;
    /** Column definitions for the skeleton */
    columns: TableColumnSkeleton[];
    /** Whether to show header skeleton */
    showHeader?: boolean;
    /** Custom header skeleton */
    headerColumns?: TableColumnSkeleton[];
}

/**
 * Skeleton rows only (without TableBody wrapper)
 * Use this when you already have a TableBody wrapper
 */
function TableSkeletonRows({
    rows = 10,
    columns,
}: {
    rows?: number;
    columns: TableColumnSkeleton[];
}) {
    return (
        <>
            {Array.from({ length: rows }).map((_, rowIndex) => (
                <TableRow key={rowIndex}>
                    {columns.map((col, colIndex) => (
                        <TableCell
                            key={colIndex}
                            className={col.width}
                            style={{
                                textAlign: col.align || 'left',
                            }}
                        >
                            {col.type === 'checkbox' ? (
                                <div className="flex items-center justify-center">
                                    <Skeleton className="size-4 rounded" />
                                </div>
                            ) : col.type === 'badge' ? (
                                <Skeleton className="h-6 w-[80px] rounded-full" />
                            ) : col.type === 'button' ? (
                                <Skeleton className="size-8 rounded" />
                            ) : col.type === 'amount' ? (
                                <Skeleton className="h-4 w-[100px]" />
                            ) : col.type === 'text-multi' ? (
                                <div className="space-y-2">
                                    {Array.from({ length: col.lines || 2 }).map((_, lineIndex) => {
                                        const width = 120 - lineIndex * 20;
                                        return (
                                            <Skeleton
                                                key={lineIndex}
                                                className={lineIndex === 0 ? 'h-4' : 'h-3'}
                                                style={{
                                                    width: `${width}px`,
                                                }}
                                            />
                                        );
                                    })}
                                </div>
                            ) : (
                                <Skeleton className="h-4 w-[140px]" />
                            )}
                        </TableCell>
                    ))}
                </TableRow>
            ))}
        </>
    );
}

/**
 * Generic table skeleton component
 * Can be configured for any table structure
 * Use this for standalone tables (includes TableBody wrapper)
 */
export function TableSkeleton({
    rows = 10,
    columns,
    showHeader = true,
    headerColumns,
}: TableSkeletonProps) {
    const headerCols = headerColumns || columns;

    return (
        <>
            {showHeader && (
                <TableHeader className="bg-muted">
                    <TableRow>
                        {headerCols.map((col, index) => (
                            <TableHead
                                key={index}
                                className={col.width}
                                style={{
                                    textAlign: col.align || 'left',
                                }}
                            >
                                <Skeleton className="h-4 w-full max-w-[100px]" />
                            </TableHead>
                        ))}
                    </TableRow>
                </TableHeader>
            )}
            <TableBody>
                <TableSkeletonRows rows={rows} columns={columns} />
            </TableBody>
        </>
    );
}

/**
 * Export skeleton rows for use inside existing TableBody
 */
export { TableSkeletonRows };

interface TablePageSkeletonProps {
    /** Number of skeleton rows */
    rows?: number;
    /** Column definitions */
    columns: TableColumnSkeleton[];
    /** Number of filter buttons to show */
    filterButtons?: number;
    /** Whether to show pagination */
    showPagination?: boolean;
    /** Custom className for container */
    className?: string;
}

/**
 * Complete table page skeleton with filters and pagination
 */
export function TablePageSkeleton({
    rows = 10,
    columns,
    filterButtons = 3,
    showPagination = true,
    className,
}: TablePageSkeletonProps) {
    return (
        <div className={`w-full flex flex-col gap-6 ${className || ''}`}>
            {/* Filter buttons skeleton */}
            {filterButtons > 0 && (
                <div className="flex items-center justify-end gap-2 px-4 lg:px-6 shrink-0">
                    {Array.from({ length: filterButtons }).map((_, index) => (
                        <Skeleton
                            key={index}
                            className="h-8"
                            style={{
                                width: index === filterButtons - 1 ? '140px' : index === 0 ? '80px' : '60px',
                            }}
                        />
                    ))}
                </div>
            )}

            {/* Table skeleton */}
            <div className="relative flex flex-col gap-4 px-4 lg:px-6 min-w-0">
                <div className="w-full overflow-x-auto rounded-lg border">
                    <div className="min-w-full inline-block">
                        <Table className="w-full">
                            <TableSkeleton rows={rows} columns={columns} />
                        </Table>
                    </div>
                </div>

                {/* Pagination skeleton */}
                {showPagination && (
                    <div className="flex items-center justify-between px-4 flex-shrink-0">
                        <Skeleton className="hidden lg:block h-4 w-[150px]" />
                        <div className="flex w-full items-center gap-8 lg:w-fit flex-shrink-0">
                            <div className="hidden items-center gap-2 lg:flex">
                                <Skeleton className="h-4 w-[90px]" />
                                <Skeleton className="h-8 w-[70px]" />
                            </div>
                            <Skeleton className="h-4 w-[80px]" />
                            <div className="ml-auto flex items-center gap-2 lg:ml-0">
                                <Skeleton className="hidden lg:block size-8" />
                                <Skeleton className="size-8" />
                                <Skeleton className="size-8" />
                                <Skeleton className="hidden lg:block size-8" />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

