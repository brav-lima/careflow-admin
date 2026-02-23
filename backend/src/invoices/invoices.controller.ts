import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common'
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
  findAll(
    @Query('subscriptionId') subscriptionId?: string,
    @Query('status') status?: string,
    @Query('month') month?: number,
    @Query('year') year?: number,
  ) {
    return this.invoicesService.findAll(subscriptionId, status, Number(month), Number(year))
  }

  @Get(':id')
  @Roles('SUPER_ADMIN', 'FINANCE')
  findOne(@Param('id') id: string) {
    return this.invoicesService.findOne(id)
  }

  @Patch(':id/mark-paid')
  @Roles('SUPER_ADMIN', 'FINANCE')
  markPaid(@Param('id') id: string) {
    return this.invoicesService.markPaid(id)
  }

  @Patch(':id/cancel')
  @Roles('SUPER_ADMIN', 'FINANCE')
  cancel(@Param('id') id: string) {
    return this.invoicesService.cancel(id)
  }
}
