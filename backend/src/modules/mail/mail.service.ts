import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class MailService {
    private readonly logger = new Logger(MailService.name);
    private readonly resend: Resend | null;
    private readonly fromEmail: string;
    private readonly enabled: boolean;

    constructor(private readonly config: ConfigService) {
        const apiKey = this.config.get<string>('RESEND_API_KEY');
        this.fromEmail = this.config.get<string>('RESEND_FROM_EMAIL') || 'CareerMate <onboarding@resend.dev>';
        this.enabled = !!apiKey && apiKey !== 'your-resend-api-key';
        this.resend = this.enabled ? new Resend(apiKey) : null;

        if (!this.enabled) {
            this.logger.warn('[MailService] RESEND_API_KEY not set — emails will be logged to console');
        }
    }

    async sendVerificationCode(email: string, code: string): Promise<void> {
        const subject = `Ваш код подтверждения CareerMate: ${code}`;
        const html = this.buildVerificationHtml(code);
        const text = `Ваш код подтверждения для регистрации в CareerMate: ${code}\n\nКод действителен 10 минут.\n\nЕсли вы не запрашивали регистрацию — просто проигнорируйте это письмо.`;

        if (!this.enabled || !this.resend) {
            // Dev fallback: log to console
            this.logger.log(`📧 [DEV] Verification code for ${email}: ${code}`);
            return;
        }

        try {
            const result = await this.resend.emails.send({
                from: this.fromEmail,
                to: email,
                subject,
                html,
                text,
            });

            if (result.error) {
                this.logger.error(`[MailService] Resend error: ${JSON.stringify(result.error)}`);
                throw new Error(`Failed to send verification email: ${result.error.message}`);
            }

            this.logger.log(`[MailService] Verification code sent to ${email}, id=${result.data?.id}`);
        } catch (err) {
            this.logger.error(`[MailService] Failed to send to ${email}:`, err instanceof Error ? err.message : err);
            throw err;
        }
    }

    private buildVerificationHtml(code: string): string {
        return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>CareerMate — код подтверждения</title></head>
<body style="margin:0;padding:0;background:#f5f7fb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:520px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.06);">
    <div style="background:linear-gradient(135deg,#6366f1 0%,#3b82f6 100%);padding:32px;text-align:center;">
      <h1 style="margin:0;color:#fff;font-size:24px;font-weight:700;letter-spacing:-0.02em;">CareerMate</h1>
      <p style="margin:8px 0 0;color:rgba(255,255,255,0.9);font-size:14px;">AI-ассистент для карьеры</p>
    </div>
    <div style="padding:36px 32px;">
      <h2 style="margin:0 0 12px;color:#0f172a;font-size:20px;font-weight:600;">Подтвердите регистрацию</h2>
      <p style="margin:0 0 28px;color:#475569;font-size:15px;line-height:1.6;">Введите этот код в приложении, чтобы завершить создание аккаунта:</p>
      <div style="background:#f1f5f9;border-radius:12px;padding:24px;text-align:center;margin-bottom:28px;">
        <div style="font-size:36px;font-weight:700;letter-spacing:0.4em;color:#1e40af;font-family:'SF Mono',Menlo,Consolas,monospace;">${code}</div>
      </div>
      <p style="margin:0 0 8px;color:#64748b;font-size:13px;">⏱ Код действителен 10 минут.</p>
      <p style="margin:0;color:#64748b;font-size:13px;">Если вы не запрашивали регистрацию — просто проигнорируйте это письмо.</p>
    </div>
    <div style="background:#f8fafc;padding:20px;text-align:center;border-top:1px solid #e2e8f0;">
      <p style="margin:0;color:#94a3b8;font-size:12px;">© CareerMate. Все права защищены.</p>
    </div>
  </div>
</body>
</html>`;
    }
}
