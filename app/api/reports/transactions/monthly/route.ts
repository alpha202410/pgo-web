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

        // Required parameter
        const year = searchParams.get('year');
        if (!year) {
            return NextResponse.json(
                { error: 'year parameter is required' },
                { status: 400 }
            );
        }
        queryParams.set('year', year);

        // Optional parameters
        const month = searchParams.get('month');
        if (month) {
            queryParams.set('month', month);
        }

        const merchantId = searchParams.get('merchant_id');
        if (merchantId) {
            queryParams.set('merchant_id', merchantId);
        }

        const pgoId = searchParams.get('pgo_id');
        if (pgoId) {
            queryParams.set('pgo_id', pgoId);
        }

        // Build the URL with query parameters
        const queryString = queryParams.toString();
        const url = `${API_CONFIG.baseURL}${API_ENDPOINTS.reports.transactionsMonthly}${queryString ? `?${queryString}` : ''}`;

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
                message: response.statusText || 'Failed to fetch monthly transaction summary',
            }));

            return NextResponse.json(
                { error: errorData.message || errorData.error || 'Failed to fetch monthly transaction summary' },
                { status: response.status }
            );
        }

        const data = await response.json();

        // Return the data directly (or unwrap if wrapped in data property)
        const summaryData = data.data || data;
        return NextResponse.json(summaryData);
    } catch (error) {
        console.error('Error fetching monthly transaction summary:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

