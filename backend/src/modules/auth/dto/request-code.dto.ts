import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class RequestCodeDto {
    @ApiProperty({ example: 'user@example.com' })
    @IsEmail({}, { message: 'Введите корректный email' })
    email!: string;

    @ApiProperty({ example: 'mySecurePassword123', minLength: 6 })
    @IsString()
    @MinLength(6, { message: 'Пароль должен содержать минимум 6 символов' })
    password!: string;
}
