'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { setTokens } from '@/shared/lib/auth';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export default function AuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const hash = typeof window !== 'undefined' ? window.location.hash : '';
    if (!hash) {
      setError('no_tokens');
      return;
    }

    const params = new URLSearchParams(hash.replace(/^#/, ''));
    const errParam = params.get('error');
    const at = params.get('at');
    const rt = params.get('rt');

    if (errParam) {
      setError(errParam);
      toast.error(`Ошибка авторизации: ${errParam}`);
      setTimeout(() => router.replace('/'), 2500);
      return;
    }

    if (!at || !rt) {
      setError('missing_tokens');
      toast.error('Не получены токены авторизации');
      setTimeout(() => router.replace('/'), 2500);
      return;
    }

    setTokens(at, rt);
    // Clear hash from URL so tokens don't linger in history
    window.history.replaceState(null, '', '/auth/callback');
    toast.success('Вход выполнен');
    router.replace('/dashboard');
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        <p className="text-sm text-muted-foreground">
          {error ? `Ошибка: ${error}. Перенаправление...` : 'Завершаем вход...'}
        </p>
      </div>
    </div>
  );
}
