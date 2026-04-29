import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { Strategy, Profile } from 'passport-google-oauth20';
import * as https from 'https';

export interface GoogleUserPayload {
    googleId: string;
    email: string;
    fullName?: string;
    picture?: string;
}

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
    private readonly logger = new Logger(GoogleStrategy.name);

    constructor(config: ConfigService) {
        super({
            clientID: config.getOrThrow<string>('GOOGLE_CLIENT_ID'),
            clientSecret: config.getOrThrow<string>('GOOGLE_CLIENT_SECRET'),
            callbackURL: config.get<string>('GOOGLE_CALLBACK_URL') || 'http://localhost:3001/auth/google/callback',
            scope: ['email', 'profile'],
        });

        // Force IPv4 at the HTTPS-agent level. Some networks (Windows + ISP without
        // working IPv6 transit) make outbound to oauth2.googleapis.com hang at the TLS
        // socket layer with no upstream response (`InternalOAuthError: Failed to obtain
        // access token`, `oauthError: {}`). Setting a dedicated agent on the underlying
        // node-oauth client guarantees code-exchange uses IPv4 regardless of DNS order.
        try {
            const agent = new https.Agent({ family: 4, keepAlive: true });
            const oauth2Client: any = (this as any)._oauth2;
            if (oauth2Client && typeof oauth2Client.setAgent === 'function') {
                oauth2Client.setAgent(agent);
                this.logger.log('[GoogleStrategy] Forced IPv4 https.Agent on OAuth2 client');
            } else if (oauth2Client) {
                oauth2Client._agent = agent;
                this.logger.log('[GoogleStrategy] Patched _agent to force IPv4 on OAuth2 client');
            }
        } catch (e: any) {
            this.logger.warn(`[GoogleStrategy] Could not set IPv4 agent: ${e?.message}`);
        }
    }

    async validate(
        _accessToken: string,
        _refreshToken: string,
        profile: Profile,
    ): Promise<GoogleUserPayload> {
        // IMPORTANT: do NOT call `done()` here. @nestjs/passport's mixin already invokes
        // the verify callback with whatever this method returns; calling `done()` ourselves
        // results in a double-invocation that overwrites the user with `undefined`.
        const email = profile.emails?.[0]?.value;
        if (!email) {
            this.logger.warn(`[GoogleStrategy] No email in Google profile id=${profile.id}`);
            throw new UnauthorizedException('Google account has no email');
        }

        const payload: GoogleUserPayload = {
            googleId: profile.id,
            email: email.toLowerCase(),
            fullName: profile.displayName,
            picture: profile.photos?.[0]?.value,
        };

        this.logger.log(`[GoogleStrategy.validate] resolved user email=${payload.email}`);
        return payload;
    }
}
