'use client';

import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { api } from '@/shared/api/api-client';
import { AuthResponseDto } from '@/shared/api/types';
import { setTokens, clearTokens } from '@/shared/lib/auth';

export function useLogin() {
  const router = useRouter();

  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      api.post<AuthResponseDto>('/auth/login', { email, password }),
    onSuccess: (data) => {
      setTokens(data.access_token, data.refresh_token);
      router.push('/dashboard');
    },
    onError: (error: any) => {
      const msg =
        error?.status === 401
          ? 'Неверный email или пароль'
          : error?.message || 'Не удалось войти';
      toast.error(msg);
    },
  });
}

export function useRegister() {
  const router = useRouter();

  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      api.post<AuthResponseDto>('/auth/register', { email, password }),
    onSuccess: (data) => {
      setTokens(data.access_token, data.refresh_token);
      router.push('/dashboard');
    },
    onError: (error: any) => {
      const msg =
        error?.status === 409
          ? 'Пользователь с таким email уже существует'
          : error?.message || 'Не удалось зарегистрироваться';
      toast.error(msg);
    },
  });
}

export function useLogout() {
  const router = useRouter();

  return () => {
    clearTokens();
    router.push('/');
  };
}
