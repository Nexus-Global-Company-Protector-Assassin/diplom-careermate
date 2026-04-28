'use client';

import { useEffect } from 'react';

interface GlobalErrorProps {
    error: Error & { digest?: string };
    reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
    useEffect(() => {
        console.error('[GlobalErrorBoundary]', error);
    }, [error]);

    return (
        <html lang="ru">
            <body style={{ margin: 0, fontFamily: 'sans-serif' }}>
                <div
                    style={{
                        display: 'flex',
                        minHeight: '100vh',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '1.5rem',
                        padding: '1.5rem',
                        textAlign: 'center',
                    }}
                >
                    <span style={{ fontSize: '3rem' }}>💥</span>
                    <h1 style={{ fontSize: '1.5rem', margin: 0 }}>Критическая ошибка приложения</h1>
                    <p style={{ color: '#6b7280', maxWidth: '32rem', margin: 0 }}>
                        {error.message || 'Произошла непредвиденная ошибка.'}
                    </p>
                    <button
                        onClick={reset}
                        style={{
                            padding: '0.5rem 1.5rem',
                            borderRadius: '0.375rem',
                            border: 'none',
                            background: '#2563eb',
                            color: '#fff',
                            cursor: 'pointer',
                            fontSize: '1rem',
                        }}
                    >
                        Перезагрузить
                    </button>
                </div>
            </body>
        </html>
    );
}
