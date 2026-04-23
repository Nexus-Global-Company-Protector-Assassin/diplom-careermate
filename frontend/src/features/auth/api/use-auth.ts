'use client';

import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { api } from '@/shared/api/api-client';
import { AuthResponseDto } from '@/shared/api/types';
import { setTokens, clearTokens } from '@/shared/lib/auth';
import { ApiError, toastMessageForError } from '@/shared/lib/api-errors';

type LoginInput = { email: string; password: string };
type RegisterInput = { email: string; password: string };

export function useLogin() {
  const router = useRouter();

  return useMutation({
    mutationFn: ({ email, password }: LoginInput) =>
      api.post<AuthResponseDto>('/auth/login', { email, password }),
    onSuccess: (data) => {
      setTokens(data.access_token, data.refresh_token);
      router.push('/dashboard');
    },
    onError: (error: unknown) => {
      const msg =
        error instanceof ApiError && error.status === 401
          ? 'Неверный email или пароль'
          : toastMessageForError(error) || 'Не удалось войти';
      toast.error(msg);
    },
  });
}

export function useRegister() {
  const router = useRouter();

  return useMutation({
    mutationFn: ({ email, password }: RegisterInput) =>
      api.post<AuthResponseDto>('/auth/register', { email, password }),
    onSuccess: (data) => {
      setTokens(data.access_token, data.refresh_token);
      router.push('/dashboard');
    },
    onError: (error: unknown) => {
      const msg =
        error instanceof ApiError && error.status === 409
          ? 'Пользователь с таким email уже существует'
          : toastMessageForError(error) || 'Не удалось зарегистрироваться';
      toast.error(msg);
    },
  });
}

export function useLogout() {
  const router = useRouter();

  return useMutation({
    mutationFn: () => api.post('/auth/logout', {}),
    onSettled: () => {
      clearTokens();
      router.push('/');
    },
  });
}
