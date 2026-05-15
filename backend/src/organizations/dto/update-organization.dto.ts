import { PartialType, OmitType, ApiPropertyOptional } from '@nestjs/swagger'
import { IsEnum, IsOptional } from 'class-validator'
import { CreateOrganizationDto } from './create-organization.dto'

export class UpdateOrganizationDto extends PartialType(
  OmitType(CreateOrganizationDto, ['document'] as const),
) {
  @ApiPropertyOptional({ enum: ['ACTIVE', 'SUSPENDED', 'CANCELED'] })
  @IsOptional()
  @IsEnum(['ACTIVE', 'SUSPENDED', 'CANCELED'])
  status?: 'ACTIVE' | 'SUSPENDED' | 'CANCELED'
}
