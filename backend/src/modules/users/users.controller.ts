import { Controller, Get, Put, UseGuards, Body, Request } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CurrentUser } from '../auth/current-user.decorator';
import { UpdateUserDto } from './dto/update-user.dto';

@ApiTags('Users')
@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @Get('me')
    @ApiOperation({ summary: 'Get current user profile' })
    @ApiResponse({ status: 200, description: 'Return current user profile' })
    async getProfile(@CurrentUser() user: any) {
        const userData = await this.usersService.findOne(user.userId);
        if (!userData) {
            return null;
        }
        const { passwordHash, hashedRefreshToken, ...result } = userData;
        return result;
    }

    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @Put('me')
    @ApiOperation({ summary: 'Update current user profile' })
    @ApiResponse({ status: 200, description: 'Return updated user profile' })
    async updateProfile(@CurrentUser() user: any, @Body() updateUserDto: UpdateUserDto) {
        const updatedUser = await this.usersService.update(user.userId, updateUserDto);
        const { passwordHash, hashedRefreshToken, ...result } = updatedUser;
        return result;
    }
}
