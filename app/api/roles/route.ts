import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/services/auth.service';
import { API_CONFIG, API_ENDPOINTS } from '@/lib/config/api';

export async function GET() {
    try {
        // Get session for authentication
        const session = await getSession();

        if (!session?.token) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Use the 'all' endpoint to get all available roles
        const url = `${API_CONFIG.baseURL}${API_ENDPOINTS.roles.all}`;

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
                message: response.statusText || 'Failed to fetch roles',
            }));

            return NextResponse.json(
                { error: errorData.message || errorData.error || 'Failed to fetch roles' },
                { status: response.status }
            );
        }

        const data = await response.json();

        // Handle different response formats
        // Backend might return an array directly or wrapped in a data property
        let roles: string[] = [];

        type RoleItem = string | { name?: string; role?: string };

        if (Array.isArray(data)) {
            // If it's an array, extract role names
            roles = data.map((role: RoleItem) => {
                // Handle both string roles and role objects with a 'name' property
                return typeof role === 'string' ? role : (role.name || role.role || '');
            }).filter(Boolean);
        } else if (data.data && Array.isArray(data.data)) {
            // If wrapped in data property
            roles = data.data.map((role: RoleItem) => {
                return typeof role === 'string' ? role : (role.name || role.role || '');
            }).filter(Boolean);
        } else if (data.roles && Array.isArray(data.roles)) {
            // If wrapped in roles property
            roles = data.roles.map((role: RoleItem) => {
                return typeof role === 'string' ? role : (role.name || role.role || '');
            }).filter(Boolean);
        }

        // Sort roles alphabetically
        roles.sort();

        return NextResponse.json(roles);
    } catch (error) {
        console.error('Error fetching roles:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

