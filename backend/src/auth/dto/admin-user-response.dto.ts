import { Exclude, Expose } from 'class-transformer'
import { ApiProperty } from '@nestjs/swagger'

@Exclude()
export class AdminUserResponseDto {
  @Expose()
  @ApiProperty()
  id: string

  @Expose()
  @ApiProperty()
  name: string

  @Expose()
  @ApiProperty()
  email: string

  @Expose()
  @ApiProperty()
  role: string

  @Expose()
  @ApiProperty()
  createdAt: Date

  // passwordHash, active, and AdminRefreshToken relations are never exposed

  constructor(partial: Record<string, unknown>) {
    Object.assign(this, partial)
  }
}
