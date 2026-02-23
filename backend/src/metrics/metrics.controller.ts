import { Controller, Get, Query, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiTags, ApiQuery } from '@nestjs/swagger'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../auth/guards/roles.guard'
import { Roles } from '../auth/decorators/roles.decorator'
import { MetricsService } from './metrics.service'

@ApiTags('metrics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('metrics')
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  @Get('summary')
  @Roles('SUPER_ADMIN', 'FINANCE')
  getSummary() {
    return this.metricsService.getSummary()
  }

  @Get('revenue')
  @Roles('SUPER_ADMIN', 'FINANCE')
  @ApiQuery({ name: 'year', required: false, type: Number })
  getRevenue(@Query('year') year?: number) {
    return this.metricsService.getRevenueByYear(Number(year) || new Date().getFullYear())
  }

  @Get('organizations')
  @Roles('SUPER_ADMIN', 'FINANCE')
  @ApiQuery({ name: 'period', required: false, enum: ['week', 'month', 'year'] })
  getOrganizations(@Query('period') period?: 'week' | 'month' | 'year') {
    return this.metricsService.getOrganizationsByPeriod(period)
  }
}
