import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ProfilesService } from './profiles.service';
import { CreateProfileDto } from './dto/create-profile.dto';

@ApiTags('Profiles')
@Controller('profiles')
export class ProfilesController {
    constructor(private readonly profilesService: ProfilesService) { }

    @Post()
    @ApiOperation({ summary: 'Create or update user profile' })
    @ApiResponse({ status: 201, description: 'Profile created/updated successfully' })
    create(@Body() createProfileDto: CreateProfileDto) {
        // TODO: Get userId from JWT/Auth guard. For PoC, we might need to pass it or mock it.
        // For now, let's assume a hardcoded userId or pass it in body/headers if needed.
        // But wait, schema says userId is unique.
        // Let's assume for PoC we pass userId in headers or body for simplicity if Auth is not fully ready.
        // OR generate a temporary user if not exists.

        // TEMPORARY: For PoC simplicity without full Auth flow, let's create a dummy user if needed
        // or expect userId in a header 'x-user-id'.
        // Actually, let's just use a hardcoded demo user ID for the PoC flow if not provided.
        const userId = 'demo-user-id';

        // Wait, we need a real user in DB because of foreign key.
        // We'll handle this in the service or assume the user exists.
        // Let's pass a dummy userId for now, but we need to ensure it exists.

        return this.profilesService.create(userId, createProfileDto);
    }

    @Get(':userId')
    @ApiOperation({ summary: 'Get user profile' })
    findOne(@Param('userId') userId: string) {
        return this.profilesService.findOne(userId);
    }
}
