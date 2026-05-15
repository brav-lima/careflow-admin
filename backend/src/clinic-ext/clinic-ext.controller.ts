import { Body, Controller, Get, Patch, Post, Query, UseGuards } from '@nestjs/common'
import { ApiTags, ApiHeader, ApiQuery } from '@nestjs/swagger'
import { ClinicExternalApiKeyGuard } from '../common/guards/clinic-external-api-key.guard'
import { ClinicExtService } from './clinic-ext.service'
import { ChangePlanDto } from './dto/change-plan.dto'
import { CancelSubscriptionDto } from './dto/cancel-subscription.dto'

@ApiTags('clinic-ext')
@ApiHeader({ name: 'x-clinic-api-key', required: true })
@UseGuards(ClinicExternalApiKeyGuard)
@Controller('v1/clinic-ext')
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

  @Patch('subscription/plan')
  changePlan(@Body() dto: ChangePlanDto) {
    return this.service.changePlan(dto.clinicId, dto.planId)
  }

  @Post('subscription/cancel')
  cancelSubscription(@Body() dto: CancelSubscriptionDto) {
    return this.service.cancelSubscription(dto.clinicId)
  }
}
