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
            'page',
            'per_page',
            'search',
            'role',
            'status',
            'associated_merchant_id',
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
                    // Sort parameter is passed as comma-separated string (e.g., "username,asc,email,desc")
                    // Backend expects it in the same format
                    queryParams.set('sort', value);
                } else {
                    queryParams.set(param, value);
                }
            }
        });

        // Build the URL with query parameters
        const queryString = queryParams.toString();
        const url = `${API_CONFIG.baseURL}${API_ENDPOINTS.users.list}${queryString ? `?${queryString}` : ''}`;

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
                message: response.statusText || 'Failed to fetch users',
            }));

            return NextResponse.json(
                { error: errorData.message || errorData.error || 'Failed to fetch users' },
                { status: response.status }
            );
        }

        const data = await response.json();

        // Parse page from request (1-based) for response
        const requestedPage = parseInt(searchParams.get('page') || String(PAGINATION.DEFAULT_PAGE), 10);
        const requestedPerPage = parseInt(searchParams.get('per_page') || String(PAGINATION.DEFAULT_PAGE_SIZE), 10);

        // Backend API returns: { status, statusCode, message, data: User[], pageNumber, pageSize, totalElements, totalPages, last }
        // We need: { data: User[], pageNumber, pageSize, totalElements, totalPages, last, first }
        if (data.data && Array.isArray(data.data)) {
            // Transform field names from backend format to frontend format
            const transformedData = data.data.map((user: {
                id: string;
                username: string;
                email: string;
                roles?: string[] | string;
                active?: boolean;
                locked?: boolean;
                associatedMerchantId?: string | null;
                lastLoginAt?: string | null;
                createdAt?: string | null;
            }) => ({
                id: user.id,
                username: user.username,
                email: user.email,
                role: Array.isArray(user.roles) && user.roles.length > 0 ? user.roles[0] : user.roles || '',
                is_active: user.active ?? false,
                is_locked: user.locked ?? false,
                associated_merchant_id: user.associatedMerchantId ?? null,
                last_login_at: user.lastLoginAt ?? null,
                created_at: user.createdAt ?? null,
            }));

            // Backend uses 0-based pagination, convert to 1-based for frontend
            const backendPageNumber = data.pageNumber ?? 0;

            const paginatedResponse = {
                data: transformedData,
                pageNumber: backendPageNumber + 1, // Convert to 1-based
                pageSize: data.pageSize ?? requestedPerPage,
                totalElements: data.totalElements ?? transformedData.length,
                totalPages: data.totalPages ?? Math.ceil((data.totalElements ?? transformedData.length) / (data.pageSize ?? requestedPerPage)),
                last: data.last ?? false,
                first: backendPageNumber === 0,
            };

            return NextResponse.json(paginatedResponse);
        } else if (Array.isArray(data)) {
            // Backend returned just an array (legacy format)
            const transformedData = data.map((user: {
                id: string;
                username: string;
                email: string;
                roles?: string[] | string;
                active?: boolean;
                locked?: boolean;
                associatedMerchantId?: string | null;
                lastLoginAt?: string | null;
                createdAt?: string | null;
            }) => ({
                id: user.id,
                username: user.username,
                email: user.email,
                role: Array.isArray(user.roles) && user.roles.length > 0 ? user.roles[0] : user.roles || '',
                is_active: user.active ?? false,
                is_locked: user.locked ?? false,
                associated_merchant_id: user.associatedMerchantId ?? null,
                last_login_at: user.lastLoginAt ?? null,
                created_at: user.createdAt ?? null,
            }));
            const paginatedResponse = {
                data: transformedData,
                pageNumber: requestedPage,
                pageSize: requestedPerPage,
                totalElements: transformedData.length,
                totalPages: 1,
                last: true,
                first: requestedPage === 1,
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
        console.error('Error fetching users:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
