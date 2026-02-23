import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiTags, ApiQuery } from '@nestjs/swagger'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../auth/guards/roles.guard'
import { Roles } from '../auth/decorators/roles.decorator'
import { SubscriptionsService } from './subscriptions.service'
import { CreateSubscriptionDto } from './dto/create-subscription.dto'

@ApiTags('subscriptions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Post()
  @Roles('SUPER_ADMIN', 'FINANCE')
  create(@Body() dto: CreateSubscriptionDto) {
    return this.subscriptionsService.create(dto)
  }

  @Get()
  @Roles('SUPER_ADMIN', 'FINANCE')
  @ApiQuery({ name: 'orgId', required: false })
  @ApiQuery({ name: 'status', required: false })
  findAll(@Query('orgId') orgId?: string, @Query('status') status?: string) {
    return this.subscriptionsService.findAll(orgId, status)
  }

  @Get(':id')
  @Roles('SUPER_ADMIN', 'FINANCE')
  findOne(@Param('id') id: string) {
    return this.subscriptionsService.findOne(id)
  }

  @Patch(':id')
  @Roles('SUPER_ADMIN', 'FINANCE')
  update(@Param('id') id: string, @Body() dto: Partial<CreateSubscriptionDto>) {
    return this.subscriptionsService.update(id, dto)
  }

  @Patch(':id/cancel')
  @Roles('SUPER_ADMIN', 'FINANCE')
  cancel(@Param('id') id: string) {
    return this.subscriptionsService.cancel(id)
  }
}
