import { Controller, Post, Body, Get, Put, Delete, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { ProfilesService } from './profiles.service';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

@ApiTags('Profiles')
@Controller('profiles')
export class ProfilesController {
    constructor(private readonly profilesService: ProfilesService) { }

    @Post('me')
    @ApiOperation({ summary: 'Create or upsert profile for current user' })
    @ApiBody({ type: CreateProfileDto })
    @ApiResponse({ status: 201, description: 'Profile created/updated successfully' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    async createProfile(
        @Body() createProfileDto: CreateProfileDto,
    ) {
        return this.profilesService.createProfile(undefined, createProfileDto);
    }

    @Get('me')
    @ApiOperation({ summary: 'Get profile for current user' })
    @ApiResponse({ status: 200, description: 'Returns the user profile' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 404, description: 'Profile not found' })
    async getProfile() {
        return this.profilesService.getProfile(undefined);
    }

    @Put('me')
    @ApiOperation({ summary: 'Update profile for current user' })
    @ApiBody({ type: UpdateProfileDto })
    @ApiResponse({ status: 200, description: 'Profile updated successfully' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 404, description: 'Profile not found' })
    async updateProfile(
        @Body() updateProfileDto: UpdateProfileDto,
    ) {
        return this.profilesService.updateProfile(undefined, updateProfileDto);
    }

    @Delete('me')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Delete profile for current user' })
    @ApiResponse({ status: 200, description: 'Profile deleted successfully' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 404, description: 'Profile not found' })
    async deleteProfile() {
        return this.profilesService.deleteProfile(undefined);
    }
}

