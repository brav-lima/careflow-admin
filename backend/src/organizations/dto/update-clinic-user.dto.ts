import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsBoolean, IsIn, IsOptional } from 'class-validator'

export class UpdateClinicUserDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  active?: boolean

  @ApiPropertyOptional({ enum: ['ADMIN', 'PROFESSIONAL', 'RECEPTIONIST'] })
  @IsOptional()
  @IsIn(['ADMIN', 'PROFESSIONAL', 'RECEPTIONIST'])
  role?: 'ADMIN' | 'PROFESSIONAL' | 'RECEPTIONIST'
}
