'use client';

import { useEffect, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { DisbursementTable } from './disbursement-table';
import { disbursementsListQueryOptions, type DisbursementListParams } from '@/features/disbursements/queries/disbursements';
import { useDisbursementsTableStore } from '@/lib/stores/disbursements-table-store';

export default function DisbursementsList() {
    const queryClient = useQueryClient();
    const { pagination } = useDisbursementsTableStore();

    // Convert pageIndex (0-based) to page (1-based) for API
    const page = pagination.pageIndex + 1;
    const per_page = pagination.pageSize;

    // Memoize queryParams to prevent unnecessary re-renders and ensure stable reference
    const queryParams: DisbursementListParams = useMemo(() => ({
        page,
        per_page,
    }), [page, per_page]);

    const { data, isLoading, isFetching } = useQuery(disbursementsListQueryOptions(queryParams));

    // Dynamically prefetch the next 2 pages when page changes
    useEffect(() => {
        if (!data) return;

        // Synchronization guard: only proceed if displayed data matches requested page
        // This prevents prefetching with stale data when queryParams changes
        if (data.pageNumber !== queryParams.page) {
            return;
        }

        const currentPage = data.pageNumber;
        const totalPages = data.totalPages;

        // Prefetch next 2 pages if they exist
        const pagesToPrefetch: number[] = [];
        for (let i = 1; i <= 2; i++) {
            const nextPage = currentPage + i;
            if (nextPage <= totalPages) {
                pagesToPrefetch.push(nextPage);
            }
        }

        // Prefetch all next pages in parallel with error handling
        if (pagesToPrefetch.length > 0) {
            pagesToPrefetch.forEach((nextPage) => {
                const nextPageParams: DisbursementListParams = {
                    ...queryParams,
                    page: nextPage,
                };

                // Only prefetch if not already in cache
                const cachedData = queryClient.getQueryData(
                    disbursementsListQueryOptions(nextPageParams).queryKey
                );

                if (!cachedData) {
                    // Cancel any existing prefetch for this page using query cancellation
                    const queryKey = disbursementsListQueryOptions(nextPageParams).queryKey;
                    queryClient.cancelQueries({ queryKey });

                    // Prefetch the next page with error handling
                    queryClient.prefetchQuery(disbursementsListQueryOptions(nextPageParams))
                        .catch((error) => {
                            // Only log if not cancelled (cancelled queries are expected during cleanup)
                            if (error.name !== 'AbortError' && !error.message?.includes('cancel')) {
                                console.error(`Failed to prefetch disbursements page ${nextPage}:`, error);
                            }
                        });
                }
            });
        }

        // Cleanup function to cancel pending prefetches when component unmounts or dependencies change
        return () => {
            // Cancel all pending prefetch queries for next pages
            pagesToPrefetch.forEach((nextPage) => {
                const nextPageParams: DisbursementListParams = {
                    ...queryParams,
                    page: nextPage,
                };
                const queryKey = disbursementsListQueryOptions(nextPageParams).queryKey;
                queryClient.cancelQueries({ queryKey });
            });
        };
    }, [queryParams, data, queryClient]);

    // Extract disbursements and pagination metadata
    const disbursements = data?.data ?? [];
    const paginationMeta = data ? {
        pageNumber: data.pageNumber,
        pageSize: data.pageSize,
        totalElements: data.totalElements,
        totalPages: data.totalPages,
        last: data.last,
        first: data.first,
    } : {
        pageNumber: page,
        pageSize: per_page,
        totalElements: 0,
        totalPages: 0,
        last: true,
        first: true,
    };

    return (
        <div className="@container/main flex flex-1 flex-col gap-2 py-2">
            <DisbursementTable
                data={disbursements}
                paginationMeta={paginationMeta}
                isLoading={isLoading || isFetching}
            />
        </div>
    )
}

