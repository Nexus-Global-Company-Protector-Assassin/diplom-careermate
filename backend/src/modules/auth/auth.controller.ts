import {
    Controller,
    Post,
    Get,
    UseGuards,
    Body,
    HttpCode,
    HttpStatus,
    UnauthorizedException,
    Req,
    Res,
    Logger,
    ExecutionContext,
    Injectable,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RtAuthGuard } from './rt-auth.guard';
import { CurrentUser } from './current-user.decorator';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RequestCodeDto } from './dto/request-code.dto';
import { VerifyCodeDto, ResendCodeDto } from './dto/verify-code.dto';
import { GoogleUserPayload } from './strategies/google.strategy';

/**
 * Wraps `AuthGuard('google')` so a passport-level failure (e.g. network error
 * during code exchange) doesn't bubble up as a raw 500. Instead we let the
 * controller render a redirect to the frontend's /auth/callback#error=… page.
 */
@Injectable()
class GoogleAuthGuard extends AuthGuard('google') {
    private readonly guardLogger = new Logger(GoogleAuthGuard.name);

    handleRequest<TUser = any>(err: any, user: any, info: any, context: ExecutionContext): TUser {
        // Always log entry to handleRequest so we can confirm it's being called
        // and capture the raw shape of (err, user, info) passport gave us.
        this.guardLogger.log(
            `[GoogleOAuth.handleRequest] err=${err ? err.constructor?.name + ':' + (err.message || JSON.stringify(err)) : 'none'} user=${user ? 'present' : 'none'} info=${info ? JSON.stringify(info).slice(0, 200) : 'none'}`,
        );
        if (err || !user) {
            const req = context.switchToHttp().getRequest();
            const diag: Record<string, any> = {};
            if (err) {
                diag.errType = typeof err;
                diag.errCtor = err?.constructor?.name;
                diag.errKeys = Object.getOwnPropertyNames(err || {});
                if (err.name) diag.name = err.name;
                if (err.code) diag.code = err.code;
                if (err.message) diag.message = err.message;
                if (err.status || err.statusCode) diag.status = err.status || err.statusCode;
                if (err.oauthError) {
                    const oe = err.oauthError;
                    diag.oauthError = {
                        keys: Object.getOwnPropertyNames(oe || {}),
                        statusCode: oe.statusCode,
                        data: typeof oe.data === 'string' ? oe.data.slice(0, 500) : oe.data,
                    };
                }
            }
            if (info) {
                diag.info = {
                    type: typeof info,
                    message: info?.message,
                    name: info?.name,
                    str: typeof info === 'string' ? info : JSON.stringify(info).slice(0, 300),
                };
            }
            // Capture Google's redirect query params — if Google rejected the redirect_uri or
            // the user denied consent, the answer arrives here as ?error=...
            const q = req.query || {};
            if (q.error || q.error_description || q.code === undefined) {
                diag.query = {
                    error: q.error,
                    error_description: q.error_description,
                    code: q.code ? '<present>' : '<missing>',
                    state: q.state ? '<present>' : '<missing>',
                };
            }
            diag.url = req.originalUrl || req.url;

            this.guardLogger.error(`[GoogleOAuth] ${JSON.stringify(diag)}`, err?.stack);

            const reason =
                q.error ||
                err?.code ||
                err?.name ||
                err?.message ||
                info?.message ||
                'oauth_failed';
            req._oauthError = reason;
            return undefined as any;
        }
        return user;
    }
}

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
    private readonly logger = new Logger(AuthController.name);

    constructor(
        private authService: AuthService,
        private config: ConfigService,
    ) { }

    @Post('login')
    @ApiOperation({ summary: 'Login user' })
    @ApiBody({ type: LoginDto })
    @HttpCode(HttpStatus.OK)
    async login(@Body() loginDto: LoginDto) {
        const user = await this.authService.validateUser(loginDto.email, loginDto.password);
        if (!user) {
            throw new UnauthorizedException('Invalid email or password');
        }
        return this.authService.login(user);
    }

    @Post('register')
    @ApiOperation({ summary: '(Legacy) Register without email verification' })
    @ApiBody({ type: RegisterDto })
    async register(@Body() registerDto: RegisterDto) {
        return this.authService.register(registerDto.email, registerDto.password);
    }

    @Post('register/request-code')
    @ApiOperation({ summary: 'Step 1: Request email verification code for registration' })
    @ApiBody({ type: RequestCodeDto })
    @HttpCode(HttpStatus.OK)
    async requestRegistrationCode(@Body() dto: RequestCodeDto) {
        return this.authService.requestRegistrationCode(dto.email, dto.password);
    }

    @Post('register/verify')
    @ApiOperation({ summary: 'Step 2: Verify code and create account' })
    @ApiBody({ type: VerifyCodeDto })
    @HttpCode(HttpStatus.OK)
    async verifyRegistrationCode(@Body() dto: VerifyCodeDto) {
        return this.authService.verifyRegistrationCode(dto.email, dto.code);
    }

    @Post('register/resend-code')
    @ApiOperation({ summary: 'Resend verification code (cooldown 60s)' })
    @ApiBody({ type: ResendCodeDto })
    @HttpCode(HttpStatus.OK)
    async resendRegistrationCode(@Body() dto: ResendCodeDto) {
        return this.authService.resendRegistrationCode(dto.email);
    }

    @Get('google')
    @UseGuards(GoogleAuthGuard)
    @ApiOperation({ summary: 'Initiate Google OAuth flow (redirects to Google)' })
    async googleAuth() {
        // Passport handles the redirect; this method intentionally does nothing.
    }

    @Get('google/callback')
    @UseGuards(GoogleAuthGuard)
    @ApiOperation({ summary: 'Google OAuth callback — issues JWT and redirects to frontend' })
    async googleAuthCallback(@Req() req: Request & { _oauthError?: string }, @Res() res: Response) {
        const payload = req.user as GoogleUserPayload | undefined;
        const frontendUrl = this.config.get<string>('FRONTEND_URL') || 'http://localhost:3000';

        if (req._oauthError || !payload) {
            const reason = req._oauthError || 'no_user';
            this.logger.warn(`[GoogleOAuth callback] redirecting to frontend with error: ${reason}`);
            return res.redirect(`${frontendUrl}/auth/callback#error=${encodeURIComponent(reason)}`);
        }

        try {
            const tokens = await this.authService.handleGoogleAuth(payload);
            // Use URL fragment so tokens never reach server logs
            const redirectUrl = `${frontendUrl}/auth/callback#at=${encodeURIComponent(tokens.access_token)}&rt=${encodeURIComponent(tokens.refresh_token)}`;
            return res.redirect(redirectUrl);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'oauth_failed';
            this.logger.error(`[GoogleOAuth handleGoogleAuth] ${message}`, err instanceof Error ? err.stack : undefined);
            return res.redirect(`${frontendUrl}/auth/callback#error=${encodeURIComponent(message)}`);
        }
    }

    @Post('logout')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @HttpCode(HttpStatus.OK)
    async logout(@CurrentUser() user: any) {
        return this.authService.logout(user.userId);
    }

    @Post('refresh')
    @UseGuards(RtAuthGuard)
    @ApiBearerAuth()
    @HttpCode(HttpStatus.OK)
    async refresh(@CurrentUser() user: any) {
        return this.authService.refreshTokens(user.userId, user.refreshToken);
    }
}
