import 'server-only';
import { disbursementsKeys, normalizeDisbursementParams, type DisbursementListParams } from './disbursements';
import { DisbursementSchema, PaginatedDisbursementResponse } from '@/lib/definitions';
import { API_CONFIG, API_ENDPOINTS } from '@/lib/config/api';
import { getSession } from '@/lib/auth/services/auth.service';
import { z } from 'zod';
import { getQueryClient } from '@/lib/server-query-client';

// Re-export getQueryClient and HydrateClient from trpc/server.tsx
// This ensures we use the same query client instance
export { getQueryClient, HydrateClient } from '@/lib/server-query-client';

/**
 * Normalizes field defaults for disbursement items
 * Ensures all specified fields default to empty string if undefined/null
 */
function normalizeFieldDefaults(item: Record<string, unknown>) {
  return {
    ...item,
    internalTransactionId: item.internalTransactionId ?? '',
    externalTransactionId: item.externalTransactionId ?? '',
    merchantTransactionId: item.merchantTransactionId ?? '',
    pspTransactionId: item.pspTransactionId ?? '',
    customerIdentifier: item.customerIdentifier ?? '',
    paymentMethod: item.paymentMethod ?? '',
    customerName: item.customerName ?? '',
    errorCode: item.errorCode ?? '',
    errorMessage: item.errorMessage ?? '',
    description: item.description ?? '',
    merchantName: item.merchantName ?? '',
    submerchantId: item.submerchantId ?? '',
    submerchantUid: item.submerchantUid ?? '',
    submerchantName: item.submerchantName ?? '',
  };
}

/**
 * Server-side function to fetch paginated disbursements list
 * Uses getSession() for authentication
 * This function is server-only and should not be imported in client components
 */
async function fetchDisbursementsListServer(
  params: DisbursementListParams = { page: 1, per_page: 10 }
): Promise<PaginatedDisbursementResponse> {
  const session = await getSession();

  if (!session?.token) {
    throw new Error('Unauthorized: No session token available');
  }

  // Build query string with pagination params
  // Backend API uses 'size' instead of 'per_page'
  const page = params.page ?? 1;
  const per_page = params.per_page ?? 10;
  const queryParams = new URLSearchParams();
  queryParams.set('page', page.toString());
  queryParams.set('size', per_page.toString());

  // Add other filter params if present
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (key !== 'page' && key !== 'per_page' && value !== undefined && value !== null && value !== '') {
        queryParams.set(key, value.toString());
      }
    });
  }

  const url = `${API_CONFIG.baseURL}${API_ENDPOINTS.disbursements.list}?${queryParams.toString()}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.token}`,
    },
    cache: 'no-store', // Ensure fresh data on each request
  });

  if (!response.ok) {
    let errorMessage = 'Failed to fetch disbursements';

    // Try to extract error message from response
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorData.error || errorMessage;
    } catch {
      // If response is not JSON, use status text
      errorMessage = response.statusText || errorMessage;
    }

    // Map HTTP status codes to appropriate errors
    if (response.status === 401) {
      throw new Error(`Unauthorized: ${errorMessage}`);
    } else if (response.status === 403) {
      throw new Error(`Forbidden: ${errorMessage}`);
    } else if (response.status === 404) {
      throw new Error(`Not Found: ${errorMessage}`);
    }

    throw new Error(`${errorMessage} (Status: ${response.status})`);
  }

  const responseData = await response.json();

  // Handle both array response (legacy) and paginated response
  let paginatedResponse: PaginatedDisbursementResponse;

  if (Array.isArray(responseData)) {
    // Legacy format: just an array
    const transformedData = responseData.map((item: Record<string, unknown>) => normalizeFieldDefaults(item));

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
    const disbursementsData = responseData.data || [];
    const transformedData = disbursementsData.map((item: Record<string, unknown>) => normalizeFieldDefaults(item));

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
}

/**
 * Prefetch first page of disbursements list on the server
 * This will populate the TanStack Query cache with the initial page
 * Client-side will dynamically prefetch the next 2 pages based on current page
 */
export async function prefetchDisbursementsList() {
  const queryClient = getQueryClient();

  // Prefetch only the first page on server
  // Client-side will handle dynamic prefetching of next pages
  const params: DisbursementListParams = { page: 1, per_page: 10 };

  // Normalize params to ensure query key matches client-side queries
  const normalizedParams = normalizeDisbursementParams(params);

  const queryOptions = {
    queryKey: disbursementsKeys.list(normalizedParams),
    queryFn: () => fetchDisbursementsListServer(normalizedParams),
    staleTime: 30 * 1000, // 30 seconds
  };

  // Ensure prefetch completes before continuing
  await queryClient.prefetchQuery(queryOptions);

  // Verify the data is in the cache
  const cachedData = queryClient.getQueryData<PaginatedDisbursementResponse>(disbursementsKeys.list(normalizedParams));
  if (!cachedData) {
    console.warn('Warning: Prefetched disbursements data not found in cache');
  }
}

