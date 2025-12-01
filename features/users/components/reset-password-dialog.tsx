'use client';

import { useState } from 'react';
import { KeyRound, Loader2, Copy, Check } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { usersKeys } from '@/features/users/queries/users';

interface ResetPasswordDialogProps {
    userId: string;
    username: string;
    trigger?: React.ReactNode;
}

interface ResetPasswordResponse {
    message: string;
    temporaryPassword?: string | null;
}

export function ResetPasswordDialog({ userId, username, trigger }: ResetPasswordDialogProps) {
    const [open, setOpen] = useState(false);
    const [temporaryPassword, setTemporaryPassword] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const queryClient = useQueryClient();

    const resetPasswordMutation = useMutation({
        mutationFn: async (): Promise<ResetPasswordResponse> => {
            const response = await fetch(`/api/users/${userId}/reset-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({}),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || data.message || 'Failed to reset password');
            }

            return data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: usersKeys.lists() });
            toast.success(data.message || 'Password reset successfully');
            
            if (data.temporaryPassword) {
                setTemporaryPassword(data.temporaryPassword);
            } else {
                // If no temporary password returned, close dialog
                setOpen(false);
            }
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Failed to reset password');
        },
    });

    const handleReset = () => {
        resetPasswordMutation.mutate();
    };

    const handleCopyPassword = async () => {
        if (temporaryPassword) {
            await navigator.clipboard.writeText(temporaryPassword);
            setCopied(true);
            toast.success('Password copied to clipboard');
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleClose = () => {
        setOpen(false);
        setTemporaryPassword(null);
        setCopied(false);
        resetPasswordMutation.reset();
    };

    return (
        <Dialog open={open} onOpenChange={(isOpen) => {
            if (!isOpen) {
                handleClose();
            } else {
                setOpen(true);
            }
        }}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant="ghost" size="sm">
                        <KeyRound className="h-4 w-4" />
                        Reset Password
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Reset Password</DialogTitle>
                    <DialogDescription>
                        {temporaryPassword
                            ? `Password has been reset for ${username}. Please copy the temporary password below.`
                            : `Are you sure you want to reset the password for ${username}? This will generate a new temporary password.`
                        }
                    </DialogDescription>
                </DialogHeader>

                {temporaryPassword && (
                    <div className="space-y-2">
                        <Label htmlFor="temp-password">Temporary Password</Label>
                        <div className="flex gap-2">
                            <Input
                                id="temp-password"
                                value={temporaryPassword}
                                readOnly
                                className="font-mono"
                            />
                            <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={handleCopyPassword}
                            >
                                {copied ? (
                                    <Check className="h-4 w-4 text-green-500" />
                                ) : (
                                    <Copy className="h-4 w-4" />
                                )}
                            </Button>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            The user will be required to change this password on their next login.
                        </p>
                    </div>
                )}

                <DialogFooter>
                    {temporaryPassword ? (
                        <Button onClick={handleClose}>
                            Done
                        </Button>
                    ) : (
                        <>
                            <Button
                                variant="outline"
                                onClick={handleClose}
                                disabled={resetPasswordMutation.isPending}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleReset}
                                disabled={resetPasswordMutation.isPending}
                            >
                                {resetPasswordMutation.isPending && (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                )}
                                Reset Password
                            </Button>
                        </>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

