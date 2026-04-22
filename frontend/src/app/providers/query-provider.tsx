'use client';

import { QueryClient, QueryClientProvider, MutationCache, QueryCache } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';
import { ApiError, toastMessageForError } from '@/shared/lib/api-errors';

function shouldRetry(failureCount: number, error: unknown): boolean {
    if (error instanceof ApiError && !error.isRetryable) return false;
    return failureCount < 2;
}

function handleGlobalError(error: unknown) {
    const message = toastMessageForError(error);
    if (error instanceof ApiError && error.kind === 'auth') {
        toast.error('Сессия истекла', { description: 'Пожалуйста, войдите снова' });
        return;
    }
    toast.error(message);
}

export function CoreQueryProvider({ children }: { children: React.ReactNode }) {
    const [queryClient] = useState(
        () =>
            new QueryClient({
                queryCache: new QueryCache({
                    onError: (error, query) => {
                        if (query.state.data !== undefined) return;
                        handleGlobalError(error);
                    },
                }),
                mutationCache: new MutationCache({
                    onError: handleGlobalError,
                }),
                defaultOptions: {
                    queries: {
                        staleTime: 60 * 1000,
                        refetchOnWindowFocus: false,
                        retry: shouldRetry,
                        retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
                    },
                    mutations: {
                        retry: false,
                    },
                },
            })
    );

    return (
        <QueryClientProvider client={queryClient}>
            {children}
        </QueryClientProvider>
    );
}
