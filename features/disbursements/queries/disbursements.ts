import { DisbursementSchema, PaginatedDisbursementResponse } from '@/lib/definitions';
import { z } from 'zod';

/**
 * Query keys factory for disbursements
 * Safe to import in both client and server components
 */
export const disbursementsKeys = {
    all: ['disbursements'] as const,
    lists: () => [...disbursementsKeys.all, 'list'] as const,
    list: (params?: DisbursementListParams) =>
        params ? [...disbursementsKeys.lists(), params] as const : [...disbursementsKeys.lists()] as const,
    details: () => [...disbursementsKeys.all, 'detail'] as const,
    detail: (id: string) => [...disbursementsKeys.details(), id] as const,
};

export interface DisbursementListParams {
    start_date?: string;
    end_date?: string;
    status?: string;
    merchant_id?: string;
    pgo_id?: string;
    amount_min?: number;
    amount_max?: number;
    search_term?: string;
    page?: number;
    per_page?: number;
    source_transaction_id?: string;
}

/**
 * Normalize params object to ensure consistent query keys
 * Removes undefined/null/empty values and ensures consistent structure
 * Exported for use in server-side prefetch to ensure cache key matching
 */
export function normalizeDisbursementParams(params: DisbursementListParams): DisbursementListParams {
    const normalized: DisbursementListParams = {
        page: params.page ?? 1,
        per_page: params.per_page ?? 10,
    };

    // Add other params only if they have values
    if (params.start_date) normalized.start_date = params.start_date;
    if (params.end_date) normalized.end_date = params.end_date;
    if (params.status) normalized.status = params.status;
    if (params.merchant_id) normalized.merchant_id = params.merchant_id;
    if (params.pgo_id) normalized.pgo_id = params.pgo_id;
    if (params.amount_min !== undefined && params.amount_min !== null) normalized.amount_min = params.amount_min;
    if (params.amount_max !== undefined && params.amount_max !== null) normalized.amount_max = params.amount_max;
    if (params.search_term) normalized.search_term = params.search_term;
    if (params.source_transaction_id) normalized.source_transaction_id = params.source_transaction_id;

    return normalized;
}

/**
 * Normalizes a disbursement item by ensuring nullable string fields default to empty strings.
 * This ensures consistent types and prevents null/undefined values from causing issues.
 */
function normalizeDisbursementItem(item: Record<string, unknown>): Record<string, unknown> {
    return {
        ...item,
        internalTransactionId: (item.internalTransactionId as string | undefined) ?? '',
        externalTransactionId: (item.externalTransactionId as string | undefined) ?? '',
        merchantTransactionId: (item.merchantTransactionId as string | undefined) ?? '',
        pspTransactionId: (item.pspTransactionId as string | undefined) ?? '',
        customerIdentifier: (item.customerIdentifier as string | undefined) ?? '',
        paymentMethod: (item.paymentMethod as string | undefined) ?? '',
        customerName: (item.customerName as string | undefined) ?? '',
        errorCode: (item.errorCode as string | undefined) ?? '',
        errorMessage: (item.errorMessage as string | undefined) ?? '',
        description: (item.description as string | undefined) ?? '',
        merchantName: (item.merchantName as string | undefined) ?? '',
        submerchantId: (item.submerchantId as string | undefined) ?? '',
        submerchantUid: (item.submerchantUid as string | undefined) ?? '',
        submerchantName: (item.submerchantName as string | undefined) ?? '',
    };
}

/**
 * Client-side query options for paginated disbursements list
 * Returns paginated response with metadata (pageNumber, pageSize, totalElements, totalPages, etc.)
 * 
 * Supports query parameters for filtering:
 * - start_date, end_date, status, merchant_id, pgo_id
 * - amount_min, amount_max, search_term
 * - page, per_page, source_transaction_id
 */
export function disbursementsListQueryOptions(
    params: DisbursementListParams = { page: 1, per_page: 10 }
) {
    // Normalize params to ensure consistent query keys
    const normalizedParams = normalizeDisbursementParams(params);

    // Ensure page and per_page have defaults
    const page = normalizedParams.page ?? 1;
    const per_page = normalizedParams.per_page ?? 10;

    // Build query string from normalizedParams to ensure consistency with cache key
    const queryParams = new URLSearchParams();
    queryParams.set('page', page.toString());
    queryParams.set('per_page', per_page.toString());

    if (normalizedParams) {
        Object.entries(normalizedParams).forEach(([key, value]) => {
            // Skip page and per_page as they're already set
            if (key !== 'page' && key !== 'per_page' && value !== undefined && value !== null && value !== '') {
                queryParams.set(key, value.toString());
            }
        });
    }

    const url = `/api/disbursements?${queryParams.toString()}`;

    // Query key uses normalized params to ensure consistent caching
    // Same params with different object references will now match
    const queryKey = disbursementsKeys.list(normalizedParams);

    return {
        queryKey,
        queryFn: async (): Promise<PaginatedDisbursementResponse> => {
            // Use absolute URL - construct it based on environment
            let fullUrl: string;
            if (typeof window !== 'undefined') {
                // Client-side: use window.location.origin
                fullUrl = `${window.location.origin}${url}`;
            } else {
                // Server-side: this shouldn't happen if prefetch worked
                // But if it does, return empty paginated response
                console.warn('QueryFn executed on server - prefetch may have failed');
                return {
                    data: [],
                    pageNumber: page,
                    pageSize: per_page,
                    totalElements: 0,
                    totalPages: 0,
                    last: true,
                    first: true,
                };
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
                    errorData.error || errorData.message || 'Failed to fetch disbursements'
                );
            }

            const responseData = await response.json();

            // Handle both array response (legacy) and paginated response
            let paginatedResponse: PaginatedDisbursementResponse;

            if (Array.isArray(responseData)) {
                // Legacy format: just an array
                // Transform to paginated format
                const transformedData = responseData.map((item: Record<string, unknown>) =>
                    normalizeDisbursementItem(item)
                );

                const parsed = z.array(DisbursementSchema).parse(transformedData);

                paginatedResponse = {
                    data: parsed,
                    pageNumber: page,
                    pageSize: per_page,
                    totalElements: parsed.length,
                    totalPages: Math.ceil(parsed.length / per_page),
                    last: true,
                    first: page === 1,
                };
            } else {
                // Paginated response format
                const transformedData = (responseData.data || []).map((item: Record<string, unknown>) =>
                    normalizeDisbursementItem(item)
                );

                const parsed = z.array(DisbursementSchema).parse(transformedData);

                paginatedResponse = {
                    data: parsed,
                    pageNumber: responseData.pageNumber ?? page,
                    pageSize: responseData.pageSize ?? per_page,
                    totalElements: responseData.totalElements ?? parsed.length,
                    totalPages: responseData.totalPages ?? Math.ceil((responseData.totalElements ?? parsed.length) / (responseData.pageSize ?? per_page)),
                    last: responseData.last ?? false,
                    first: responseData.first ?? (page === 1),
                };
            }

            return paginatedResponse;
        },
        staleTime: 30 * 1000, // 30 seconds
        placeholderData: (previousData: PaginatedDisbursementResponse | undefined) => previousData, // Keep previous data while fetching new page
    };
}

