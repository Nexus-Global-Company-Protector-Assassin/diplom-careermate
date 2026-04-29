'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { api } from '@/shared/api/api-client';
import { AuthResponseDto } from '@/shared/api/types';
import { setTokens, clearTokens } from '@/shared/lib/auth';
import { ApiError, toastMessageForError } from '@/shared/lib/api-errors';

type LoginInput = { email: string; password: string };
type RegisterInput = { email: string; password: string };
type RequestCodeInput = { email: string; password: string };
type VerifyCodeInput = { email: string; code: string };
type ResendCodeInput = { email: string };
type CodeRequestResponse = { message: string; expiresInSeconds: number };

export function useLogin() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ email, password }: LoginInput) =>
      api.post<AuthResponseDto>('/auth/login', { email, password }),
    onSuccess: (data) => {
      queryClient.clear();
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
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ email, password }: RegisterInput) =>
      api.post<AuthResponseDto>('/auth/register', { email, password }),
    onSuccess: (data) => {
      queryClient.clear();
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

export function useRequestRegisterCode() {
  return useMutation({
    mutationFn: ({ email, password }: RequestCodeInput) =>
      api.post<CodeRequestResponse>('/auth/register/request-code', { email, password }),
    onError: (error: unknown) => {
      const msg =
        error instanceof ApiError && error.status === 409
          ? 'Пользователь с таким email уже существует'
          : toastMessageForError(error) || 'Не удалось отправить код';
      toast.error(msg);
    },
  });
}

export function useVerifyRegisterCode() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ email, code }: VerifyCodeInput) =>
      api.post<AuthResponseDto>('/auth/register/verify', { email, code }),
    onSuccess: (data) => {
      queryClient.clear();
      setTokens(data.access_token, data.refresh_token);
      toast.success('Email подтверждён');
      router.push('/dashboard');
    },
    onError: (error: unknown) => {
      toast.error(toastMessageForError(error) || 'Неверный код');
    },
  });
}

export function useResendRegisterCode() {
  return useMutation({
    mutationFn: ({ email }: ResendCodeInput) =>
      api.post<CodeRequestResponse>('/auth/register/resend-code', { email }),
    onSuccess: () => toast.success('Код отправлен повторно'),
    onError: (error: unknown) => {
      toast.error(toastMessageForError(error) || 'Не удалось отправить код');
    },
  });
}

export function useLogout() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => api.post('/auth/logout', {}),
    onSettled: () => {
      queryClient.clear();
      clearTokens();
      router.push('/');
    },
  });
}
