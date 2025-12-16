import { Controller, Request, Post, UseGuards, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RtAuthGuard } from './rt-auth.guard';
import { CurrentUser } from './current-user.decorator';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) { }

    @Post('login')
    @ApiOperation({ summary: 'Login user' })
    @ApiResponse({ status: 200, description: 'Return JWT tokens' })
    @HttpCode(HttpStatus.OK)
    async login(@Body() req) {
        const user = await this.authService.validateUser(req.email, req.password);
        if (!user) {
            throw new Error('Invalid credentials');
        }
        return this.authService.login(user);
    }

    @Post('register')
    @ApiOperation({ summary: 'Register new user' })
    @ApiResponse({ status: 201, description: 'User successfully registered' })
    async register(@Body() req) {
        return this.authService.register(req.email, req.password);
    }

    @Post('logout')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Logout user' })
    @ApiResponse({ status: 200, description: 'User successfully logged out' })
    @HttpCode(HttpStatus.OK)
    async logout(@CurrentUser() user: any) {
        return this.authService.logout(user.userId);
    }

    @Post('refresh')
    @UseGuards(RtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Refresh tokens' })
    @ApiResponse({ status: 200, description: 'Return new JWT tokens' })
    @HttpCode(HttpStatus.OK)
    async refresh(@CurrentUser() user: any) {
        return this.authService.refreshTokens(user.userId, user.refreshToken);
    }
}
