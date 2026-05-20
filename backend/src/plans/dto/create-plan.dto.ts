import { IsString, IsNumber, IsOptional, IsBoolean, Min, IsArray } from 'class-validator'
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

  @ApiPropertyOptional({
    example: ['AGENDA', 'PATIENTS', 'FINANCIAL_BASIC', 'EVOLUTIONS'],
    description: 'Feature keys habilitadas neste plano (ver PlanFeature em pelvi-ui)',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  features?: string[]

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean

  @ApiPropertyOptional({ default: true, description: 'Se false, o plano não aparece na interface da clínica (somente via admin)' })
  @IsOptional()
  @IsBoolean()
  visibleToClinic?: boolean
}
