import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import {
  IsDefined,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  Matches,
  MinLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator'
import { OrganizationOwnerDto, OrganizationType } from './create-organization-with-owner.dto'

export class CreateOrganizationInputDto {
  @ApiPropertyOptional({ enum: OrganizationType, default: OrganizationType.CLINIC_PJ })
  @IsOptional()
  @IsEnum(OrganizationType)
  organizationType?: OrganizationType

  @ApiProperty()
  @IsString()
  @MinLength(2)
  name: string

  @ApiPropertyOptional({ description: 'CNPJ (14 dígitos) — obrigatório para CLINIC_PJ' })
  @ValidateIf(
    (o) =>
      (o.organizationType ?? OrganizationType.CLINIC_PJ) === OrganizationType.CLINIC_PJ,
  )
  @IsString()
  @Matches(/^\d{14}$/, { message: 'CNPJ deve conter 14 dígitos numéricos' })
  document?: string

  @ApiProperty()
  @IsEmail()
  email: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string

  @ApiPropertyOptional({ description: 'ID de Clinic existente no pelvi-ui (alternativa a owner)' })
  @IsOptional()
  @IsString()
  clinicExternalId?: string

  @ApiPropertyOptional({ type: () => OrganizationOwnerDto })
  @ValidateIf((o) => !o.clinicExternalId)
  @IsDefined({ message: 'owner é obrigatório quando clinicExternalId não é fornecido' })
  @ValidateNested()
  @Type(() => OrganizationOwnerDto)
  owner?: OrganizationOwnerDto
}
