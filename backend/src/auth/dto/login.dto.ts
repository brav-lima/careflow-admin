import { IsEmail, IsString } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class LoginDto {
+ @ApiProperty({ description: 'User account password', example: 'P@ssw0rd123!' })   
  @IsEmail()
  email: string

  @ApiProperty()
  @IsString()
  password: string
}
