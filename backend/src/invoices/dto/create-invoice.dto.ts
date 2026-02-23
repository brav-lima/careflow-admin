import { IsString, IsNumber, IsDateString, IsOptional, Min } from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { Type } from 'class-transformer'

export class CreateInvoiceDto {
  @ApiProperty()
  @IsString()
  subscriptionId: string

  @ApiProperty({ example: 197.0 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  amount: number

  @ApiProperty({ description: 'Data de vencimento (ISO 8601)' })
  @IsDateString()
  dueDate: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string
}
