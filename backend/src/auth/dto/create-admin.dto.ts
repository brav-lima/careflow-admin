import { IsEmail, IsEnum, IsString, Matches, MinLength } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'
import { AdminRole } from '@prisma/client'

export class CreateAdminDto {
  @ApiProperty({ example: 'João Silva' })
  @IsString()
  name: string

  @ApiProperty({ example: 'joao@careflow.com.br' })
  @IsEmail()
  email: string

  @ApiProperty()
  @IsString()
  @MinLength(12, { message: 'Password must be at least 12 characters' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/, {
    message: 'Password must contain uppercase, lowercase, number and special character',
  })
  password: string

  @ApiProperty({ enum: AdminRole })
  @IsEnum(AdminRole)
  role: AdminRole
}
