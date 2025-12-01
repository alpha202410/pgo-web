import {
    MonthlyDisbursementSummarySchema,
    MonthlyDisbursementSummary,
    MonthlyDisbursementSummaryParams,
} from '@/lib/definitions';
import { QUERY_CACHE } from '@/lib/config/constants';

/**
 * Query keys factory for disbursement reports
 * Safe to import in both client and server components
 */
export const reportsKeys = {
    all: ['reports'] as const,
    disbursementsMonthly: () => [...reportsKeys.all, 'disbursements', 'monthly'] as const,
    disbursementsMonthlyWithParams: (params: MonthlyDisbursementSummaryParams) =>
        [...reportsKeys.disbursementsMonthly(), params] as const,
};

/**
 * Get current year and month for default params
 */
export function getCurrentPeriod(): { year: number; month: number } {
    const now = new Date();
    return {
        year: now.getFullYear(),
        month: now.getMonth() + 1, // 1-12
    };
}

/**
 * Normalize params object to ensure consistent query keys
 * Removes undefined/null values and ensures consistent structure
 */
export function normalizeReportParams(
    params: MonthlyDisbursementSummaryParams
): MonthlyDisbursementSummaryParams {
    const normalized: MonthlyDisbursementSummaryParams = {
        year: params.year,
    };

    // Add optional params only if they have values
    if (params.month !== undefined && params.month !== null) {
        normalized.month = params.month;
    }
    if (params.merchant_id) normalized.merchant_id = params.merchant_id;
    if (params.pgo_id) normalized.pgo_id = params.pgo_id;

    return normalized;
}

/**
 * Client-side query options for monthly disbursement summary
 */
export function monthlyDisbursementSummaryQueryOptions(params: MonthlyDisbursementSummaryParams) {
    // Normalize params to ensure consistent query keys
    const normalizedParams = normalizeReportParams(params);

    // Build query string from params
    const queryParams = new URLSearchParams();
    queryParams.set('year', normalizedParams.year.toString());

    if (normalizedParams.month !== undefined) {
        queryParams.set('month', normalizedParams.month.toString());
    }
    if (normalizedParams.merchant_id) {
        queryParams.set('merchant_id', normalizedParams.merchant_id);
    }
    if (normalizedParams.pgo_id) {
        queryParams.set('pgo_id', normalizedParams.pgo_id);
    }

    const url = `/api/reports/disbursements/monthly?${queryParams.toString()}`;

    // Query key uses normalized params to ensure consistent caching
    const queryKey = reportsKeys.disbursementsMonthlyWithParams(normalizedParams);

    return {
        queryKey,
        queryFn: async (): Promise<MonthlyDisbursementSummary> => {
            // Use absolute URL - construct it based on environment
            let fullUrl: string;
            if (typeof window !== 'undefined') {
                // Client-side: use window.location.origin
                fullUrl = `${window.location.origin}${url}`;
            } else {
                // Server-side: this shouldn't happen if prefetch worked
                console.warn('QueryFn executed on server - prefetch may have failed');
                throw new Error('monthlyDisbursementSummaryQueryOptions should only be used client-side');
            }

            const response = await fetch(fullUrl, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(
                    errorData.error || errorData.message || 'Failed to fetch monthly disbursement summary'
                );
            }

            const responseData = await response.json();
            return MonthlyDisbursementSummarySchema.parse(responseData);
        },
        staleTime: QUERY_CACHE.STALE_TIME_DETAIL, // Reports can be cached longer
    };
}

