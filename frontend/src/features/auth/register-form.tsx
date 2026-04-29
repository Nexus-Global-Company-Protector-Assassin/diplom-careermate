'use client';

import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Button } from '@/shared/ui/button';
import {
  useRequestRegisterCode,
  useVerifyRegisterCode,
  useResendRegisterCode,
} from '@/features/auth/api/use-auth';
import { GoogleButton } from './google-button';

const registerSchema = z
  .object({
    email: z.string().email('Введите корректный email'),
    password: z.string().min(6, 'Пароль должен содержать минимум 6 символов'),
    confirmPassword: z.string().min(1, 'Подтвердите пароль'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Пароли не совпадают',
    path: ['confirmPassword'],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

type Step = 'credentials' | 'code';

export function RegisterForm() {
  const [step, setStep] = useState<Step>('credentials');
  const [pendingEmail, setPendingEmail] = useState('');
  const [code, setCode] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const codeInputRef = useRef<HTMLInputElement>(null);

  const requestCode = useRequestRegisterCode();
  const verifyCode = useVerifyRegisterCode();
  const resendCode = useResendRegisterCode();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({ resolver: zodResolver(registerSchema) });

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setInterval(() => setResendCooldown((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [resendCooldown]);

  useEffect(() => {
    if (step === 'code') codeInputRef.current?.focus();
  }, [step]);

  const onSubmitCredentials = (data: RegisterFormValues) => {
    requestCode.mutate(
      { email: data.email, password: data.password },
      {
        onSuccess: () => {
          setPendingEmail(data.email);
          setStep('code');
          setResendCooldown(60);
        },
      },
    );
  };

  const onSubmitCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) return;
    verifyCode.mutate({ email: pendingEmail, code });
  };

  const onResend = () => {
    if (resendCooldown > 0) return;
    resendCode.mutate(
      { email: pendingEmail },
      { onSuccess: () => setResendCooldown(60) },
    );
  };

  if (step === 'code') {
    return (
      <form onSubmit={onSubmitCode} className="flex flex-col gap-4">
        <div className="rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
          Мы отправили 6-значный код на <strong className="text-foreground">{pendingEmail}</strong>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="reg-code">Код подтверждения</Label>
          <Input
            id="reg-code"
            ref={codeInputRef}
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            placeholder="123456"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            className="text-center text-2xl tracking-[0.4em] font-mono"
          />
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={code.length !== 6 || verifyCode.isPending}
        >
          {verifyCode.isPending ? 'Проверяем...' : 'Подтвердить'}
        </Button>

        <div className="flex items-center justify-between text-sm">
          <button
            type="button"
            onClick={() => {
              setStep('credentials');
              setCode('');
            }}
            className="text-muted-foreground hover:text-foreground"
          >
            ← Назад
          </button>
          <button
            type="button"
            onClick={onResend}
            disabled={resendCooldown > 0 || resendCode.isPending}
            className="text-indigo-400 hover:text-indigo-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {resendCooldown > 0
              ? `Отправить заново (${resendCooldown}с)`
              : resendCode.isPending
              ? 'Отправляем...'
              : 'Отправить код заново'}
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <GoogleButton />

      <div className="relative my-1">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">или email</span>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmitCredentials)} className="flex flex-col gap-4" autoComplete="on">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="reg-email">Email</Label>
          <Input
            id="reg-email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            aria-invalid={!!errors.email}
            {...register('email')}
          />
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="reg-password">Пароль</Label>
          <Input
            id="reg-password"
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            aria-invalid={!!errors.password}
            {...register('password')}
          />
          {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="reg-confirm">Подтвердите пароль</Label>
          <Input
            id="reg-confirm"
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            aria-invalid={!!errors.confirmPassword}
            {...register('confirmPassword')}
          />
          {errors.confirmPassword && (
            <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={requestCode.isPending}>
          {requestCode.isPending ? 'Отправляем код...' : 'Зарегистрироваться'}
        </Button>
      </form>
    </div>
  );
}
