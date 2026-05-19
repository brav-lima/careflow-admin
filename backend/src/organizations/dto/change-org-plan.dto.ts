import { IsUUID } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class ChangeOrgPlanDto {
  @ApiProperty()
  @IsUUID('4')
  planId: string
}
