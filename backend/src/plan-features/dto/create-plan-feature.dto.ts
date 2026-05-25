import { IsString, IsOptional, IsBoolean, IsInt, Min, MinLength, Matches } from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { Type } from 'class-transformer'

export class CreatePlanFeatureDto {
  @ApiProperty({ example: 'DOCUMENTS', description: 'Chave única em UPPER_SNAKE_CASE' })
  @IsString()
  @MinLength(2)
  @Matches(/^[A-Z][A-Z0-9_]*$/, { message: 'key deve ser UPPER_SNAKE_CASE (ex: DOCUMENTS, FINANCIAL_BASIC)' })
  key: string

  @ApiProperty({ example: 'Módulo de Documentos' })
  @IsString()
  @MinLength(2)
  label: string

  @ApiPropertyOptional({ example: 'Permite gerar e armazenar documentos em PDF para pacientes' })
  @IsOptional()
  @IsString()
  description?: string

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  active?: boolean

  @ApiPropertyOptional({ default: 0, description: 'Ordem de exibição nas listagens' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder?: number
}
