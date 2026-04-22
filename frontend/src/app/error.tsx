'use client';

import { useEffect } from 'react';
import { Button } from '@/shared/ui/button';

interface ErrorPageProps {
    error: Error & { digest?: string };
    reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
    useEffect(() => {
        console.error('[ErrorBoundary]', error);
    }, [error]);

    const isNetwork = error.message?.includes('соединения') || error.message?.includes('fetch');

    return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-6 text-center">
            <div className="flex flex-col items-center gap-2">
                <span className="text-5xl">{isNetwork ? '📡' : '⚠️'}</span>
                <h1 className="text-2xl font-semibold text-foreground">
                    {isNetwork ? 'Нет соединения с сервером' : 'Что-то пошло не так'}
                </h1>
                <p className="max-w-md text-muted-foreground">
                    {isNetwork
                        ? 'Проверьте интернет-соединение и попробуйте снова.'
                        : error.message || 'Произошла непредвиденная ошибка.'}
                </p>
            </div>
            <Button onClick={reset}>Попробовать снова</Button>
        </div>
    );
}
