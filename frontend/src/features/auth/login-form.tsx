'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Button } from '@/shared/ui/button';
import { useLogin } from '@/features/auth/api/use-auth';
import { GoogleButton } from './google-button';

const loginSchema = z.object({
  email: z.string().email('Введите корректный email'),
  password: z.string().min(1, 'Введите пароль'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const login = useLogin();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) });

  const onSubmit = (data: LoginFormValues) => {
    login.mutate({ email: data.email, password: data.password });
  };

  return (
    <div className="flex flex-col gap-4">
      <GoogleButton label="Войти через Google" />

      <div className="relative my-1">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">или email</span>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" autoComplete="on">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="login-email">Email</Label>
        <Input
          id="login-email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          aria-invalid={!!errors.email}
          {...register('email')}
        />
        {errors.email && (
          <p className="text-xs text-destructive">{errors.email.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="login-password">Пароль</Label>
        <Input
          id="login-password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          aria-invalid={!!errors.password}
          {...register('password')}
        />
        {errors.password && (
          <p className="text-xs text-destructive">{errors.password.message}</p>
        )}
      </div>

      <div className="text-right -mt-2">
        <span className="text-xs text-muted-foreground cursor-default">
          Забыли пароль?
        </span>
      </div>

      <Button type="submit" className="w-full" disabled={login.isPending}>
        {login.isPending ? 'Вход...' : 'Войти'}
      </Button>
    </form>
    </div>
  );
}
