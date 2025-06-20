'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import type { APIResponse } from '@/types/apiResponse';
import type { StripeCheckoutSession } from '@/types/stripe';

type VerificationState = 'loading' | 'success' | 'error' | 'invalid';

export default function SuccessPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [verificationState, setVerificationState] = useState<VerificationState>('loading');
    const [session, setSession] = useState<StripeCheckoutSession | null>(null);
    const [errorMessage, setErrorMessage] = useState<string>('');

    useEffect(() => {
        const sessionId = searchParams.get('session_id');

        if (!sessionId) {
            setVerificationState('invalid');
            setErrorMessage('No session ID provided');
            return;
        }

        verifySession(sessionId);
    }, [searchParams]);

    const verifySession = async (sessionId: string) => {
        try {
            const response = await fetch('/api/stripe/check-session', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ sessionId }),
            });

            const data: APIResponse<StripeCheckoutSession> = await response.json();

            if (data.success && data.payload) {
                setSession(data.payload);
                setVerificationState('success');
            } else {
                setVerificationState('error');
                setErrorMessage(data.message || 'Failed to verify session');
            }
        } catch (error) {
            console.error('Error verifying session:', error);
            setVerificationState('error');
            setErrorMessage('An unexpected error occurred');
        }
    };

    const handleGoToDashboard = () => {
        router.push('/dashboard');
    };

    const handleContactSupport = () => {
        // You can replace this with your support URL or email
        window.open('mailto:support@yourapp.com', '_blank');
    };

    const renderContent = () => {
        switch (verificationState) {
            case 'loading':
                return (
                    <Card className="w-full max-w-lg mx-auto">
                        <CardHeader className="text-center space-y-4">
                            <div className="mx-auto w-16 h-16 flex items-center justify-center">
                                <Icons.spinner className="h-8 w-8 animate-spin text-primary" />
                            </div>
                            <div>
                                <CardTitle className="text-2xl">Verifying Payment</CardTitle>
                                <CardDescription className="mt-2">
                                    Please wait while we confirm your subscription...
                                </CardDescription>
                            </div>
                        </CardHeader>
                    </Card>
                );

            case 'success':
                return (
                    <Card className="w-full max-w-lg mx-auto">
                        <CardHeader className="text-center space-y-4">
                            <div className="mx-auto w-16 h-16 flex items-center justify-center bg-green-100 dark:bg-green-900/20 rounded-full">
                                <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                            </div>
                            <div>
                                <CardTitle className="text-2xl text-green-800 dark:text-green-200">Payment Successful!</CardTitle>
                                <CardDescription className="mt-2">
                                    Your subscription has been activated successfully.
                                </CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {session && (
                                <div className="bg-muted/50 p-4 rounded-lg space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-muted-foreground">Amount:</span>
                                        <span className="text-sm font-medium">
                                            ${(session.amount_total || 0) / 100} {session.currency?.toUpperCase()}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-muted-foreground">Payment Status:</span>
                                        <span className="text-sm font-medium text-green-600 dark:text-green-400 capitalize">
                                            {session.payment_status}
                                        </span>
                                    </div>
                                    {session.customer_details?.email && (
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-muted-foreground">Email:</span>
                                            <span className="text-sm font-medium">
                                                {session.customer_details.email}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            )}
                            <Button onClick={handleGoToDashboard} className="w-full" size="lg">
                                Go to Dashboard
                            </Button>
                        </CardContent>
                    </Card>
                );

            case 'error':
                return (
                    <Card className="w-full max-w-lg mx-auto">
                        <CardHeader className="text-center space-y-4">
                            <div className="mx-auto w-16 h-16 flex items-center justify-center bg-red-100 dark:bg-red-900/20 rounded-full">
                                <XCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
                            </div>
                            <div>
                                <CardTitle className="text-2xl text-red-800 dark:text-red-200">Payment Verification Failed</CardTitle>
                                <CardDescription className="mt-2">
                                    We couldn't verify your payment. Please contact support if you believe this is an error.
                                </CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 rounded-lg">
                                <p className="text-sm text-red-700 dark:text-red-300">{errorMessage}</p>
                            </div>
                            <div className="space-y-3">
                                <Button onClick={handleContactSupport} className="w-full" size="lg">
                                    Contact Support
                                </Button>
                                <Button onClick={handleGoToDashboard} variant="outline" className="w-full" size="lg">
                                    Go to Dashboard
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                );

            case 'invalid':
                return (
                    <Card className="w-full max-w-lg mx-auto">
                        <CardHeader className="text-center space-y-4">
                            <div className="mx-auto w-16 h-16 flex items-center justify-center bg-orange-100 dark:bg-orange-900/20 rounded-full">
                                <AlertCircle className="h-8 w-8 text-orange-600 dark:text-orange-400" />
                            </div>
                            <div>
                                <CardTitle className="text-2xl text-orange-800 dark:text-orange-200">Invalid Session</CardTitle>
                                <CardDescription className="mt-2">
                                    The payment session could not be found or is invalid.
                                </CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 p-4 rounded-lg">
                                <p className="text-sm text-orange-700 dark:text-orange-300">{errorMessage}</p>
                            </div>
                            <div className="space-y-3">
                                <Button onClick={() => router.push('/pricing')} className="w-full" size="lg">
                                    View Pricing
                                </Button>
                                <Button onClick={handleGoToDashboard} variant="outline" className="w-full" size="lg">
                                    Go to Dashboard
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                );

            default:
                return null;
        }
    };

    return (
        <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center">
            {renderContent()}
        </div>
    );
}