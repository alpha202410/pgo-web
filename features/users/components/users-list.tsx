'use client';

import { useEffect, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { UsersTable } from '../componets/users-table';
import { usersListQueryOptions, type UserListParams } from '@/features/users/queries/users';
import { useUsersTableStore } from '@/lib/stores/users-table-store';
import { PAGINATION } from '@/lib/config/constants';

export default function UsersList() {
    const queryClient = useQueryClient();
    const { pagination, sorting, columnFilters, setPagination, setSorting, setColumnFilters } = useUsersTableStore();

    // Reset to first page when sorting or filtering changes
    useEffect(() => {
        const currentPagination = useUsersTableStore.getState().pagination;
        setPagination({ ...currentPagination, pageIndex: PAGINATION.DEFAULT_PAGE });
    }, [sorting, columnFilters, setPagination]);

    // Use pageIndex directly (1-based)
    const page = pagination.pageIndex;
    const per_page = pagination.pageSize;

    // Convert sorting state to sort parameter format (e.g., ["username,asc", "email,desc"])
    const sortParams = useMemo(() => {
        return sorting.map(sort => {
            const direction = sort.desc ? 'desc' : 'asc';
            return `${sort.id},${direction}`;
        });
    }, [sorting]);

    // Convert column filters to query parameters
    const filterParams = useMemo(() => {
        const params: { role?: string; status?: string } = {};
        
        columnFilters.forEach(filter => {
            if (filter.id === 'role' && Array.isArray(filter.value)) {
                // For role filter, join multiple values with comma (or use first value)
                // Adjust based on backend API expectations
                params.role = filter.value.join(',');
            } else if (filter.id === 'is_active' && Array.isArray(filter.value)) {
                // Convert status filter values to backend format
                // The filter uses combined values like 'active-unlocked', 'active-locked', etc.
                // Backend might expect different format - adjust as needed
                const statusValues = filter.value as string[];
                if (statusValues.length > 0) {
                    params.status = statusValues.join(',');
                }
            }
        });
        
        return params;
    }, [columnFilters]);

    // Memoize queryParams to prevent unnecessary re-renders and ensure stable reference
    const queryParams: UserListParams = useMemo(() => ({
        page,
        per_page,
        ...(sortParams.length > 0 && { sort: sortParams }),
        ...filterParams,
    }), [page, per_page, sortParams, filterParams]);

    const { data, isLoading, isFetching } = useQuery(usersListQueryOptions(queryParams));

    // Dynamically prefetch the next pages when page changes
    useEffect(() => {
        if (!data) return;

        const currentPage = data.pageNumber;
        const totalPages = data.totalPages;

        // Prefetch next pages if they exist (1-based pagination)
        const pagesToPrefetch: number[] = [];
        for (let i = 1; i <= PAGINATION.PREFETCH_PAGES_AHEAD; i++) {
            const nextPage = currentPage + i;
            if (nextPage <= totalPages) {
                pagesToPrefetch.push(nextPage);
            }
        }

        // Prefetch all next pages in parallel with error handling
        if (pagesToPrefetch.length > 0) {
            pagesToPrefetch.forEach((nextPage) => {
                const nextPageParams: UserListParams = {
                    ...queryParams,
                    page: nextPage,
                };

                // Only prefetch if not already in cache
                const cachedData = queryClient.getQueryData(
                    usersListQueryOptions(nextPageParams).queryKey
                );

                if (!cachedData) {
                    // Cancel any existing prefetch for this page using query cancellation
                    const queryKey = usersListQueryOptions(nextPageParams).queryKey;
                    queryClient.cancelQueries({ queryKey });

                    // Prefetch the next page with error handling
                    queryClient.prefetchQuery(usersListQueryOptions(nextPageParams))
                        .catch((error) => {
                            // Only log if not cancelled (cancelled queries are expected during cleanup)
                            if (error.name !== 'AbortError' && !error.message?.includes('cancel')) {
                                console.error(`Failed to prefetch users page ${nextPage}:`, error);
                            }
                        });
                }
            });
        }

        // Cleanup function to cancel pending prefetches when component unmounts or dependencies change
        return () => {
            // Cancel all pending prefetch queries for next pages
            pagesToPrefetch.forEach((nextPage) => {
                const nextPageParams: UserListParams = {
                    ...queryParams,
                    page: nextPage,
                };
                const queryKey = usersListQueryOptions(nextPageParams).queryKey;
                queryClient.cancelQueries({ queryKey });
            });
        };
    }, [queryParams, data, queryClient]);

    // Extract users and pagination metadata
    const users = data?.data ?? [];
    const paginationMeta = data ? {
        pageNumber: data.pageNumber,
        pageSize: data.pageSize,
        totalElements: data.totalElements,
        totalPages: data.totalPages,
        last: data.last,
        first: data.first,
    } : {
        pageNumber: pagination.pageIndex,
        pageSize: per_page,
        totalElements: 0,
        totalPages: 0,
        last: true,
        first: true,
    };

    return (
        <div className="@container/main flex flex-1 flex-col gap-2 py-2">
            <UsersTable
                data={users}
                paginationMeta={paginationMeta}
                isLoading={isLoading || isFetching}
            />
        </div>
    )
}
