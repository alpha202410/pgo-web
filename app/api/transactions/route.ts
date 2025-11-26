import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/services/auth.service';
import { API_CONFIG, API_ENDPOINTS } from '@/lib/config/api';

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
            'page',
            'per_page',
            'search',
            'status',
            'merchant_id',
            'pgo_id',
            'start_date',
            'end_date',
            'amount_min',
            'amount_max',
            'sort',
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
                } else if (param === 'sort') {
                    // Sort parameter is passed as comma-separated string
                    queryParams.set('sort', value);
                } else {
                    queryParams.set(param, value);
                }
            }
        });

        // Build the URL with query parameters
        const queryString = queryParams.toString();
        const url = `${API_CONFIG.baseURL}${API_ENDPOINTS.transactions.list}${queryString ? `?${queryString}` : ''}`;

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
                message: response.statusText || 'Failed to fetch transactions',
            }));

            return NextResponse.json(
                { error: errorData.message || errorData.error || 'Failed to fetch transactions' },
                { status: response.status }
            );
        }

        const data = await response.json();

        // Handle response format from backend
        // Backend API returns: { status, statusCode, message, data: Transaction[], pageNumber, pageSize, totalElements, totalPages, last }
        if (data.data && Array.isArray(data.data)) {
            // Backend uses 0-based pagination, convert to 1-based for frontend
            const backendPageNumber = data.pageNumber ?? 0;
            const page = parseInt(searchParams.get('page') || '1', 10);
            const perPage = parseInt(searchParams.get('per_page') || '15', 10);

            const paginatedResponse = {
                data: data.data,
                pageNumber: backendPageNumber + 1, // Convert to 1-based
                pageSize: data.pageSize ?? perPage,
                totalElements: data.totalElements ?? data.data.length,
                totalPages: data.totalPages ?? Math.ceil((data.totalElements ?? data.data.length) / (data.pageSize ?? perPage)),
                last: data.last ?? false,
                first: backendPageNumber === 0,
            };

            return NextResponse.json(paginatedResponse);
        } else if (Array.isArray(data)) {
            // Backend returned just an array (legacy format)
            const page = parseInt(searchParams.get('page') || '1', 10);
            const perPage = parseInt(searchParams.get('per_page') || '15', 10);

            const paginatedResponse = {
                data: data,
                pageNumber: page,
                pageSize: perPage,
                totalElements: data.length,
                totalPages: 1,
                last: true,
                first: page === 1,
            };

            return NextResponse.json(paginatedResponse);
        } else {
            // Fallback: return error
            console.error('Unexpected response format:', data);
            return NextResponse.json(
                { error: 'Unexpected response format from backend' },
                { status: 500 }
            );
        }
    } catch (error) {
        console.error('Error fetching transactions:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

