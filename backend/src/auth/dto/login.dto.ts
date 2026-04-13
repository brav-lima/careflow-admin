import { IsEmail, IsString } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class LoginDto {
  @ApiProperty({ example: 'admin@careflow.com.br' })
  @IsEmail()
  email: string

  @ApiProperty()
  @IsString()
  password: string
}
