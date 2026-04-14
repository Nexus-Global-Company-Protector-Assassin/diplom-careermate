import { Controller, Post, Body, Get, Put, Delete, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { ProfilesService } from './profiles.service';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@ApiTags('Profiles')
@Controller('profiles')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ProfilesController {
    constructor(private readonly profilesService: ProfilesService) { }

    @Post('me')
    @ApiOperation({ summary: 'Create or upsert profile for current user' })
    @ApiBody({ type: CreateProfileDto })
    @ApiResponse({ status: 201, description: 'Profile created/updated successfully' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    async createProfile(
        @CurrentUser() user: any,
        @Body() createProfileDto: CreateProfileDto,
    ) {
        return this.profilesService.createProfile(user.userId, createProfileDto);
    }

    @Get('me')
    @ApiOperation({ summary: 'Get profile for current user' })
    @ApiResponse({ status: 200, description: 'Returns the user profile' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 404, description: 'Profile not found' })
    async getProfile(@CurrentUser() user: any) {
        return this.profilesService.getProfile(user.userId);
    }

    @Put('me')
    @ApiOperation({ summary: 'Update profile for current user' })
    @ApiBody({ type: UpdateProfileDto })
    @ApiResponse({ status: 200, description: 'Profile updated successfully' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 404, description: 'Profile not found' })
    async updateProfile(
        @CurrentUser() user: any,
        @Body() updateProfileDto: UpdateProfileDto,
    ) {
        return this.profilesService.updateProfile(user.userId, updateProfileDto);
    }

    @Delete('me')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Delete profile for current user' })
    @ApiResponse({ status: 200, description: 'Profile deleted successfully' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 404, description: 'Profile not found' })
    async deleteProfile(@CurrentUser() user: any) {
        return this.profilesService.deleteProfile(user.userId);
    }
}

