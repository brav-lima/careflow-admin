import { IsEmail, IsString, MaxLength } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class LoginDto {
  @ApiProperty({ description: 'User email address', example: 'user@example.com' })
  @IsEmail()
  @MaxLength(254)
  email: string

  @ApiProperty({ description: 'User account password', example: 'P@ssw0rd123!' })
  @IsString()
  @MaxLength(128)
  password: string
}
