import { UserSchema, PaginatedUserResponse } from '@/lib/definitions';
import { z } from 'zod';
import { PAGINATION, QUERY_CACHE } from '@/lib/config/constants';

/**
 * Query keys factory for users
 * Safe to import in both client and server components
 */
export const usersKeys = {
    all: ['users'] as const,
    lists: () => [...usersKeys.all, 'list'] as const,
    list: (params?: UserListParams) =>
        params ? [...usersKeys.lists(), params] as const : [...usersKeys.lists()] as const,
    details: () => [...usersKeys.all, 'detail'] as const,
    detail: (id: string) => [...usersKeys.details(), id] as const,
};

export interface UserListParams {
    page?: number;
    per_page?: number;
    search?: string;
    role?: string;
    status?: string;
    associated_merchant_id?: string;
    sort?: string[];
}

/**
 * Normalize params object to ensure consistent query keys
 * Removes undefined/null/empty values and ensures consistent structure
 * Exported for use in server-side prefetch to ensure cache key matching
 * Uses 1-based pagination
 */
export function normalizeUserParams(params: UserListParams): UserListParams {
    const normalized: UserListParams = {
        page: params.page ?? PAGINATION.DEFAULT_PAGE,
        per_page: params.per_page ?? PAGINATION.DEFAULT_PAGE_SIZE,
    };

    // Add other params only if they have values
    if (params.search) normalized.search = params.search;
    if (params.role) normalized.role = params.role;
    if (params.status) normalized.status = params.status;
    if (params.associated_merchant_id) normalized.associated_merchant_id = params.associated_merchant_id;
    if (params.sort && params.sort.length > 0) normalized.sort = params.sort;

    return normalized;
}

/**
 * Client-side query options for paginated users list
 * Returns paginated response with metadata (pageNumber, pageSize, totalElements, totalPages, etc.)
 * Uses 1-based pagination
 * 
 * Supports query parameters for filtering:
 * - search (username/email), role, status (active/locked), associated_merchant_id
 * - page, per_page
 */
export function usersListQueryOptions(
    params: UserListParams = { page: PAGINATION.DEFAULT_PAGE, per_page: PAGINATION.DEFAULT_PAGE_SIZE }
) {
    // Normalize params to ensure consistent query keys
    const normalizedParams = normalizeUserParams(params);

    // Ensure page and per_page have defaults (1-based pagination)
    const page = normalizedParams.page ?? PAGINATION.DEFAULT_PAGE;
    const per_page = normalizedParams.per_page ?? PAGINATION.DEFAULT_PAGE_SIZE;

    // Build query string from normalizedParams to match cache key
    const queryParams = new URLSearchParams();
    queryParams.set('page', page.toString());
    queryParams.set('per_page', per_page.toString());

    Object.entries(normalizedParams).forEach(([key, value]) => {
        // Skip page and per_page as they're already set
        if (key === 'sort' && Array.isArray(value) && value.length > 0) {
            // Handle sort as comma-separated string
            queryParams.set('sort', value.join(','));
        } else if (key !== 'page' && key !== 'per_page' && value !== undefined && value !== null && value !== '') {
            queryParams.set(key, value.toString());
        }
    });

    const url = `/api/users?${queryParams.toString()}`;

    // Query key uses normalized params to ensure consistent caching
    // Same params with different object references will now match
    const queryKey = usersKeys.list(normalizedParams);

    return {
        queryKey,
        queryFn: async (): Promise<PaginatedUserResponse> => {
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
                    errorData.error || errorData.message || 'Failed to fetch users'
                );
            }

            const responseData = await response.json();

            // Handle both array response (legacy) and paginated response
            let paginatedResponse: PaginatedUserResponse;

            if (Array.isArray(responseData)) {
                // Legacy format: just an array
                // Transform to paginated format
                const parsed = z.array(UserSchema).parse(responseData);

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
                // Paginated response format (already transformed by API route)
                const parsed = z.array(UserSchema).parse(responseData.data || []);

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
        staleTime: QUERY_CACHE.STALE_TIME_LIST,
        placeholderData: (previousData: PaginatedUserResponse | undefined) => previousData, // Keep previous data while fetching new page
    };
}

/**
 * Client-side query options for single user detail
 */
export function userDetailQueryOptions(userId: string) {
    const url = `/api/users/${userId}`;

    return {
        queryKey: usersKeys.detail(userId),
        queryFn: async () => {
            let fullUrl: string;
            if (typeof window !== 'undefined') {
                fullUrl = `${window.location.origin}${url}`;
            } else {
                throw new Error('userDetailQueryOptions should only be used client-side');
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
                    errorData.error || errorData.message || 'Failed to fetch user'
                );
            }

            const responseData = await response.json();
            return UserSchema.parse(responseData);
        },
        staleTime: QUERY_CACHE.STALE_TIME_DETAIL,
    };
}
