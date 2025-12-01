import { ChangePasswordForm } from '@/components/change-password-form';
import { getSession } from '@/lib/auth/services/auth.service';
import { redirect } from 'next/navigation';

export default async function ChangePasswordPage() {
    const session = await getSession();

    // If no session, redirect to login
    if (!session) {
        redirect('/login');
    }

    // Check if this is a forced password change
    const isForced = session.requirePasswordChange === true;

    return (
        <div className="bg-muted flex min-h-svh flex-col items-center justify-center p-6 md:p-10">
            <div className="w-full max-w-md">
                <ChangePasswordForm isForced={isForced} redirectTo="/dashboard" />
            </div>
        </div>
    );
}

