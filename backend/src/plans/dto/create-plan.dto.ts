import { IsString, IsNumber, IsOptional, IsBoolean, Min, IsObject } from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { Type } from 'class-transformer'

export class CreatePlanDto {
  @ApiProperty()
  @IsString()
  name: string

  @ApiProperty({ example: 197.0 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  priceMonthly: number

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  maxUsers: number

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  maxPatients: number

  @ApiPropertyOptional({ example: { nfse: true, whatsapp: false } })
  @IsOptional()
  @IsObject()
  features?: Record<string, boolean>

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean
}
