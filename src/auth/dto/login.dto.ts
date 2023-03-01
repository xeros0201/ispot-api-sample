import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNumber, IsString } from 'class-validator';

export class LoginDto {
  @IsString()
  @IsEmail()
  @ApiProperty({
    example: 'tyler.beutel@blackbook.ai',
  })
  email: string;

  @ApiProperty({
    example: 'Aa@123456',
  })
  @IsString()
  password: string;
}
