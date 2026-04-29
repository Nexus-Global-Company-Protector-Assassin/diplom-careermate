import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, Length } from 'class-validator';

export class VerifyCodeDto {
    @ApiProperty({ example: 'user@example.com' })
    @IsEmail({}, { message: 'Введите корректный email' })
    email!: string;

    @ApiProperty({ example: '123456', description: '6-digit verification code' })
    @IsString()
    @Length(6, 6, { message: 'Код должен содержать ровно 6 цифр' })
    code!: string;
}

export class ResendCodeDto {
    @ApiProperty({ example: 'user@example.com' })
    @IsEmail({}, { message: 'Введите корректный email' })
    email!: string;
}
