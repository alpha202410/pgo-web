import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/services/auth.service';
import { API_CONFIG, API_ENDPOINTS } from '@/lib/config/api';

/**
 * POST /api/users/[id]/reset-password
 * Admin resets a user's password
 * Uses the user's UID to call the backend endpoint
 */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // Get session for authentication
        const session = await getSession();

        if (!session?.token) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Check admin privileges
        const isAdmin = session.roles?.some(
            role => role === 'Super Administrator' || role === 'Administrator'
        );

        if (!isAdmin) {
            return NextResponse.json(
                { error: 'Forbidden' },
                { status: 403 }
            );
        }

        const { id: userUid } = await params;

        // Parse request body (optional - may contain new password or let backend generate one)
        const body = await request.json().catch(() => ({}));

        // Build the URL for reset password endpoint
        // Endpoint: /admin/v1/users/uid/{uid}/reset-password
        const url = `${API_CONFIG.baseURL}${API_ENDPOINTS.users.resetPassword.replace('{uid}', userUid)}`;

        // Call backend API to reset password
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.token}`,
            },
            body: JSON.stringify(body),
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            console.error('Reset password error:', {
                status: response.status,
                data,
            });
            return NextResponse.json(
                { error: data.message || data.error || 'Failed to reset password' },
                { status: response.status }
            );
        }

        return NextResponse.json({
            message: data.message || 'Password reset successfully',
        });
    } catch (error) {
        console.error('Error resetting password:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

