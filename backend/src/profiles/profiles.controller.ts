import { Controller, Get, Post, Body, Put, Delete, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ProfilesService } from './profiles.service';
import { CreateProfileDto } from '../shared/dto/create-profile.dto';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiTags('profiles')
@Controller('profiles')
export class ProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

  @UseGuards(AuthGuard('jwt'))
  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  async getProfile(@Request() req) {
    // The actual user ID should come from the JWT token
    return this.profilesService.getProfile(req.user.userId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create current user profile' })
  async createProfile(@Request() req, @Body() createProfileDto: CreateProfileDto) {
    return this.profilesService.createProfile(req.user.userId, createProfileDto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Put('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update current user profile' })
  async updateProfile(@Request() req, @Body() updateProfileDto: CreateProfileDto) {
    return this.profilesService.updateProfile(req.user.userId, updateProfileDto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete current user profile' })
  async deleteProfile(@Request() req) {
    return this.profilesService.deleteProfile(req.user.userId);
  }
}