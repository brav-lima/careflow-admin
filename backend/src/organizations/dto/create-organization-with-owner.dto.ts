import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Matches,
  MinLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator'

export enum OrganizationType {
  CLINIC_PJ = 'CLINIC_PJ',
  SOLO_PF = 'SOLO_PF',
}

export class OrganizationOwnerDto {
  @ApiProperty()
  @IsString()
  @MinLength(2)
  name!: string

  @ApiProperty({ description: 'CPF (somente números)', example: '11122233344' })
  @IsString()
  @IsNotEmpty()
  @Length(11, 11, { message: 'CPF deve ter exatamente 11 dígitos' })
  @Matches(/^\d{11}$/, { message: 'CPF deve conter apenas números' })
  cpf!: string

  @ApiProperty()
  @IsEmail()
  email!: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string
}

export class CreateOrganizationWithOwnerDto {
  @ApiProperty({ enum: OrganizationType, default: OrganizationType.CLINIC_PJ })
  @IsEnum(OrganizationType)
  organizationType!: OrganizationType

  @ApiProperty()
  @IsString()
  @MinLength(2)
  name!: string

  @ApiPropertyOptional({
    description: 'CNPJ (14 dígitos) — obrigatório para CLINIC_PJ; omitir para SOLO_PF (CPF do responsável é usado)',
    example: '12345678000190',
  })
  @ValidateIf((o) => o.organizationType === OrganizationType.CLINIC_PJ)
  @IsString()
  @Matches(/^\d{14}$/, { message: 'CNPJ deve conter 14 dígitos numéricos' })
  document?: string

  @ApiProperty()
  @IsEmail()
  email!: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string

  @ApiProperty({ type: () => OrganizationOwnerDto })
  @ValidateNested()
  @Type(() => OrganizationOwnerDto)
  owner!: OrganizationOwnerDto
}
