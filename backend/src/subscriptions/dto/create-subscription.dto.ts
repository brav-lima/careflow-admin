import { IsString, IsOptional, IsDateString } from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class CreateSubscriptionDto {
  @ApiProperty()
  @IsString()
  organizationId: string

  @ApiProperty()
  @IsString()
  planId: string

  @ApiPropertyOptional({ description: 'Data fim do trial (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  trialEndsAt?: string
}
