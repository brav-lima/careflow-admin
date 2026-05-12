import { Controller, Get, Post, Patch, Body, Param, ParseUUIDPipe, Query, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiTags, ApiQuery } from '@nestjs/swagger'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../auth/guards/roles.guard'
import { Roles } from '../auth/decorators/roles.decorator'
import { SubscriptionsService } from './subscriptions.service'
import { CreateSubscriptionDto } from './dto/create-subscription.dto'
import { UpdateSubscriptionDto } from './dto/update-subscription.dto'

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
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findAll(
    @Query('orgId') orgId?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.subscriptionsService.findAll(
      orgId,
      status,
      page ? Number(page) : undefined,
      limit ? Number(limit) : undefined,
    )
  }

  @Get(':id')
  @Roles('SUPER_ADMIN', 'FINANCE')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.subscriptionsService.findOne(id)
  }

  @Patch(':id')
  @Roles('SUPER_ADMIN', 'FINANCE')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateSubscriptionDto) {
    return this.subscriptionsService.update(id, dto)
  }

  @Patch(':id/cancel')
  @Roles('SUPER_ADMIN', 'FINANCE')
  cancel(@Param('id', ParseUUIDPipe) id: string) {
    return this.subscriptionsService.cancel(id)
  }
}
