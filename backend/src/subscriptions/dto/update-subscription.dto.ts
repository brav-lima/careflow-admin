import { IsDateString, IsEnum, IsOptional } from 'class-validator'
import { ApiPropertyOptional } from '@nestjs/swagger'

export class UpdateSubscriptionDto {
  @ApiPropertyOptional({ description: 'Nova data fim do trial (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  trialEndsAt?: string

  @ApiPropertyOptional({ enum: ['TRIAL', 'ACTIVE', 'SUSPENDED', 'CANCELED'] })
  @IsOptional()
  @IsEnum(['TRIAL', 'ACTIVE', 'SUSPENDED', 'CANCELED'])
  status?: string
}
