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
            'type',
            'kyc_verified',
            'sort',
        ];

        allowedParams.forEach((param) => {
            const value = searchParams.get(param);
            if (value) {
                // Backend API uses 'size' instead of 'per_page'
                if (param === 'per_page') {
                    queryParams.set('size', value);
                } else if (param === 'page') {
                    // Backend uses 0-based pagination, frontend also sends 0-based
                    // Pass through as-is
                    queryParams.set('page', value);
                } else if (param === 'sort') {
                    // Sort parameter is passed as comma-separated string (e.g., "name,asc,code,desc")
                    // Backend expects it in the same format
                    queryParams.set('sort', value);
                } else {
                    queryParams.set(param, value);
                }
            }
        });

        // Build the URL with query parameters
        const queryString = queryParams.toString();
        const url = `${API_CONFIG.baseURL}${API_ENDPOINTS.merchants.list}${queryString ? `?${queryString}` : ''}`;

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
                message: response.statusText || 'Failed to fetch merchants',
            }));

            return NextResponse.json(
                { error: errorData.message || errorData.error || 'Failed to fetch merchants' },
                { status: response.status }
            );
        }

        const data = await response.json();

        // Backend API returns: { status, statusCode, message, data: Merchant[], pageNumber, pageSize, totalElements, totalPages, last }
        // We need: { data: Merchant[], pageNumber, pageSize, totalElements, totalPages, last, first }
        if (data.data && Array.isArray(data.data)) {
            // Transform field names from backend format to frontend format
            const transformedData = data.data.map((merchant: {
                id: string;
                uid: string;
                code: string;
                name: string;
                type?: string;
                status?: string;
                active?: boolean;
                kycVerified?: boolean;
                email?: string | null;
                contactInfo?: string | null;
                description?: string | null;
                createdAt?: string | null;
                updatedAt?: string | null;
            }) => ({
                id: merchant.id,
                uid: merchant.uid,
                code: merchant.code,
                name: merchant.name,
                type: merchant.type ?? '',
                status: merchant.status ?? (merchant.active ? 'active' : 'inactive'),
                kyc_verified: merchant.kycVerified ?? false,
                email: merchant.email ?? null,
                contact_info: merchant.contactInfo ?? null,
                description: merchant.description ?? null,
                created_at: merchant.createdAt ?? null,
                updated_at: merchant.updatedAt ?? null,
            }));

            // Backend uses 0-based pagination, frontend also uses 0-based
            const backendPageNumber = data.pageNumber ?? parseInt(searchParams.get('page') || '0');

            const paginatedResponse = {
                data: transformedData,
                pageNumber: backendPageNumber, // Keep 0-based
                pageSize: data.pageSize ?? parseInt(searchParams.get('per_page') || '15'),
                totalElements: data.totalElements ?? transformedData.length,
                totalPages: data.totalPages ?? Math.ceil((data.totalElements ?? transformedData.length) / (data.pageSize ?? parseInt(searchParams.get('per_page') || '15'))),
                last: data.last ?? false,
                first: backendPageNumber === 0,
            };

            return NextResponse.json(paginatedResponse);
        } else if (Array.isArray(data)) {
            // Backend returned just an array (legacy format)
            // Use 0-based pagination to match the paginated format branch
            const page = parseInt(searchParams.get('page') || '0');
            const perPage = parseInt(searchParams.get('per_page') || '15');
            const transformedData = data.map((merchant: {
                id: string;
                uid: string;
                code: string;
                name: string;
                type?: string;
                status?: string;
                active?: boolean;
                kycVerified?: boolean;
                email?: string | null;
                contactInfo?: string | null;
                description?: string | null;
                createdAt?: string | null;
                updatedAt?: string | null;
            }) => ({
                id: merchant.id,
                uid: merchant.uid,
                code: merchant.code,
                name: merchant.name,
                type: merchant.type ?? '',
                status: merchant.status ?? (merchant.active ? 'active' : 'inactive'),
                kyc_verified: merchant.kycVerified ?? false,
                email: merchant.email ?? null,
                contact_info: merchant.contactInfo ?? null,
                description: merchant.description ?? null,
                created_at: merchant.createdAt ?? null,
                updated_at: merchant.updatedAt ?? null,
            }));
            const paginatedResponse = {
                data: transformedData,
                pageNumber: page,
                pageSize: perPage,
                totalElements: transformedData.length,
                totalPages: 1,
                last: true,
                first: page === 0,
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
        console.error('Error fetching merchants:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

