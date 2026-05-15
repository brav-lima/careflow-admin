import { Controller, Get, Post, Patch, Body, Param, ParseUUIDPipe, Query, UseGuards } from '@nestjs/common'
// Note: Patch is kept for the generic update; payments/cancellations use Post
import { ApiBearerAuth, ApiTags, ApiQuery } from '@nestjs/swagger'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../auth/guards/roles.guard'
import { Roles } from '../auth/decorators/roles.decorator'
import { InvoicesService } from './invoices.service'
import { CreateInvoiceDto } from './dto/create-invoice.dto'

@ApiTags('invoices')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('invoices')
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Post()
  @Roles('SUPER_ADMIN', 'FINANCE')
  create(@Body() dto: CreateInvoiceDto) {
    return this.invoicesService.create(dto)
  }

  @Get()
  @Roles('SUPER_ADMIN', 'FINANCE')
  @ApiQuery({ name: 'subscriptionId', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'month', required: false, type: Number })
  @ApiQuery({ name: 'year', required: false, type: Number })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findAll(
    @Query('subscriptionId') subscriptionId?: string,
    @Query('status') status?: string,
    @Query('month') month?: string,
    @Query('year') year?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.invoicesService.findAll(
      subscriptionId,
      status,
      month ? Number(month) : undefined,
      year ? Number(year) : undefined,
      page ? Number(page) : undefined,
      limit ? Number(limit) : undefined,
    )
  }

  @Get(':id')
  @Roles('SUPER_ADMIN', 'FINANCE')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.invoicesService.findOne(id)
  }

  @Post(':id/payments')
  @Roles('SUPER_ADMIN', 'FINANCE')
  markPaid(@Param('id', ParseUUIDPipe) id: string) {
    return this.invoicesService.markPaid(id)
  }

  @Post(':id/cancellations')
  @Roles('SUPER_ADMIN', 'FINANCE')
  cancel(@Param('id', ParseUUIDPipe) id: string) {
    return this.invoicesService.cancel(id)
  }
}
