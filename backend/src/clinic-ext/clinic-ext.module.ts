import { Module } from '@nestjs/common'
import { ClinicExtController } from './clinic-ext.controller'
import { ClinicExtService } from './clinic-ext.service'

@Module({
  controllers: [ClinicExtController],
  providers: [ClinicExtService],
})
export class ClinicExtModule {}
