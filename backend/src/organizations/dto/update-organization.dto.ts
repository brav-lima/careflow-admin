import { PartialType, OmitType } from '@nestjs/swagger'
import { IsEnum, IsOptional } from 'class-validator'
import { ApiPropertyOptional } from '@nestjs/swagger'
import { CreateOrganizationDto } from './create-organization.dto'

export class UpdateOrganizationDto extends PartialType(
  OmitType(CreateOrganizationDto, ['document'] as const),
) {}

export class UpdateOrgStatusDto {
  @ApiPropertyOptional({ enum: ['ACTIVE', 'SUSPENDED', 'CANCELED'] })
  @IsOptional()
  @IsEnum(['ACTIVE', 'SUSPENDED', 'CANCELED'])
  status: 'ACTIVE' | 'SUSPENDED' | 'CANCELED'
}
