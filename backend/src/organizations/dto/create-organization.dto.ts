import { IsString, IsEmail, IsOptional, Matches, MinLength } from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class CreateOrganizationDto {
  @ApiProperty()
  @IsString()
  @MinLength(2)
  name: string

  @ApiProperty({ description: 'CNPJ (somente números)', example: '12345678000190' })
  @IsString()
  @Matches(/^\d{14}$/, { message: 'CNPJ deve conter 14 dígitos numéricos' })
  document: string

  @ApiProperty()
  @IsEmail()
  email: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string

  @ApiPropertyOptional({ description: 'ID de uma Clinic já existente no careflow (para vincular sem criar nova)' })
  @IsOptional()
  @IsString()
  clinicExternalId?: string
}
