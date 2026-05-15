import { IsString, IsUUID } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class ChangePlanDto {
  @ApiProperty()
  @IsString()
  clinicId: string

  @ApiProperty()
  @IsUUID()
  planId: string
}
