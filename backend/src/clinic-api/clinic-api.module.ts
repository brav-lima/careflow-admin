import { Global, Module } from '@nestjs/common'
import { ClinicApiService } from './clinic-api.service'

@Global()
@Module({
  providers: [ClinicApiService],
  exports: [ClinicApiService],
})
export class ClinicApiModule {}
