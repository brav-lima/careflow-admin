import { Controller, Get, Query, UseGuards } from '@nestjs/common'
import { ApiTags, ApiHeader, ApiQuery } from '@nestjs/swagger'
import { ClinicExternalApiKeyGuard } from '../common/guards/clinic-external-api-key.guard'
import { ClinicExtService } from './clinic-ext.service'

@ApiTags('clinic-ext')
@ApiHeader({ name: 'x-clinic-api-key', required: true })
@UseGuards(ClinicExternalApiKeyGuard)
@Controller('clinic-ext')
export class ClinicExtController {
  constructor(private readonly service: ClinicExtService) {}

  @Get('subscription')
  @ApiQuery({ name: 'clinicId', required: true })
  getSubscription(@Query('clinicId') clinicId: string) {
    return this.service.getSubscription(clinicId)
  }

  @Get('plans')
  getPlans() {
    return this.service.getPlans()
  }
}
