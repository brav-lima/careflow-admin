import { IsString } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class CancelSubscriptionDto {
  @ApiProperty()
  @IsString()
  clinicId: string
}
