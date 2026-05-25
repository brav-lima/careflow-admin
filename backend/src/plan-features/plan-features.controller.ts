import { Controller, Get, Post, Patch, Delete, Body, Param, ParseUUIDPipe, UseGuards, Query } from '@nestjs/common'
import { ApiBearerAuth, ApiTags, ApiQuery } from '@nestjs/swagger'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../auth/guards/roles.guard'
import { Roles } from '../auth/decorators/roles.decorator'
import { PlanFeaturesService } from './plan-features.service'
import { CreatePlanFeatureDto } from './dto/create-plan-feature.dto'
import { UpdatePlanFeatureDto } from './dto/update-plan-feature.dto'

@ApiTags('plan-features')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('plan-features')
export class PlanFeaturesController {
  constructor(private readonly planFeaturesService: PlanFeaturesService) {}

  @Get()
  @ApiQuery({ name: 'includeInactive', required: false, type: Boolean })
  findAll(@Query('includeInactive') includeInactive?: string) {
    return this.planFeaturesService.findAll(includeInactive === 'true')
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.planFeaturesService.findOne(id)
  }

  @Post()
  @Roles('SUPER_ADMIN')
  create(@Body() dto: CreatePlanFeatureDto) {
    return this.planFeaturesService.create(dto)
  }

  @Patch(':id')
  @Roles('SUPER_ADMIN')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdatePlanFeatureDto) {
    return this.planFeaturesService.update(id, dto)
  }

  @Delete(':id')
  @Roles('SUPER_ADMIN')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.planFeaturesService.remove(id)
  }
}
