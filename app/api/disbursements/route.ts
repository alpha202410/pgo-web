import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/services/auth.service';
import { API_CONFIG, API_ENDPOINTS } from '@/lib/config/api';
import { PAGINATION } from '@/lib/config/constants';

export async function GET(request: NextRequest) {
    try {
        // Get session for authentication
        const session = await getSession();

        if (!session?.token) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Extract query parameters from the request
        const searchParams = request.nextUrl.searchParams;
        const queryParams = new URLSearchParams();

        // Add all query parameters if they exist
        const allowedParams = [
            'start_date',
            'end_date',
            'status',
            'merchant_id',
            'pgo_id',
            'amount_min',
            'amount_max',
            'search_term',
            'page',
            'per_page',
            'source_transaction_id',
        ];

        allowedParams.forEach((param) => {
            const value = searchParams.get(param);
            if (value) {
                // Backend API uses 'size' instead of 'per_page'
                if (param === 'per_page') {
                    queryParams.set('size', value);
                } else if (param === 'page') {
                    // Frontend uses 1-based pagination, backend uses 0-based
                    // Convert: page 1 -> 0, page 2 -> 1, etc.
                    const pageNum = parseInt(value, 10);
                    queryParams.set('page', Math.max(0, pageNum - 1).toString());
                } else {
                    queryParams.set(param, value);
                }
            }
        });

        // Build the URL with query parameters
        const queryString = queryParams.toString();
        const url = `${API_CONFIG.baseURL}${API_ENDPOINTS.disbursements.list}${queryString ? `?${queryString}` : ''}`;

        // Fetch from backend API
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.token}`,
            },
            cache: 'no-store',
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({
                message: response.statusText || 'Failed to fetch disbursements',
            }));

            return NextResponse.json(
                { error: errorData.message || errorData.error || 'Failed to fetch disbursements' },
                { status: response.status }
            );
        }

        const data = await response.json();

        // Parse page from request (1-based) for response
        const requestedPage = parseInt(searchParams.get('page') || String(PAGINATION.DEFAULT_PAGE), 10);
        const requestedPerPage = parseInt(searchParams.get('per_page') || String(PAGINATION.DEFAULT_PAGE_SIZE), 10);

        // Return the full paginated response structure
        // Backend API should return: { data: Disbursement[], pageNumber, pageSize, totalElements, totalPages, last, first }
        // If backend returns wrapped in another structure, extract it
        if (data.data && typeof data.data === 'object' && !Array.isArray(data.data)) {
            // Backend wrapped paginated response in data field
            const innerData = data.data;
            // Convert backend 0-based to frontend 1-based
            if (innerData.pageNumber !== undefined) {
                innerData.pageNumber = innerData.pageNumber + 1;
                innerData.first = innerData.pageNumber === 1;
            }
            return NextResponse.json(innerData);
        } else if (data.data && Array.isArray(data.data)) {
            // Backend returned { data: Disbursement[], ...metadata }
            // Backend uses 0-based pagination, convert to 1-based
            const backendPageNumber = data.pageNumber ?? 0;
            const totalElements = data.totalElements ?? data.data.length;
            const pageSize = data.pageSize ?? requestedPerPage;

            const paginatedResponse = {
                data: data.data,
                pageNumber: backendPageNumber + 1, // Convert to 1-based
                pageSize: pageSize,
                totalElements: totalElements,
                totalPages: data.totalPages ?? Math.ceil(totalElements / pageSize),
                last: data.last ?? false,
                first: backendPageNumber === 0,
            };
            return NextResponse.json(paginatedResponse);
        } else if (Array.isArray(data)) {
            // Backend returned just an array (legacy format)
            const paginatedResponse = {
                data: data,
                pageNumber: requestedPage,
                pageSize: requestedPerPage,
                totalElements: data.length,
                totalPages: 1,
                last: true,
                first: requestedPage === 1,
            };
            return NextResponse.json(paginatedResponse);
        } else {
            // Backend returned paginated structure directly
            // Convert backend 0-based to frontend 1-based
            if (data.pageNumber !== undefined) {
                data.pageNumber = data.pageNumber + 1;
                data.first = data.pageNumber === 1;
            }
            return NextResponse.json(data);
        }
    } catch (error) {
        console.error('Error fetching disbursements:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
