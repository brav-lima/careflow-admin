import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Query, UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiTags, ApiQuery } from '@nestjs/swagger'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../auth/guards/roles.guard'
import { Roles } from '../auth/decorators/roles.decorator'
import { CreateOrganizationUseCase } from './application/create-organization.usecase'
import { UpdateOrgStatusUseCase } from './application/update-status.usecase'
import { ListOrganizationsUseCase } from './application/list-organizations.usecase'
import { CreateOrganizationDto } from './dto/create-organization.dto'
import { UpdateOrganizationDto, UpdateOrgStatusDto } from './dto/update-organization.dto'
import { Inject } from '@nestjs/common'
import { IOrganizationRepository, ORGANIZATION_REPOSITORY } from './domain/organization.repository'

@ApiTags('organizations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('organizations')
export class OrganizationsController {
  constructor(
    private readonly createOrg: CreateOrganizationUseCase,
    private readonly updateOrgStatus: UpdateOrgStatusUseCase,
    private readonly listOrgs: ListOrganizationsUseCase,
    @Inject(ORGANIZATION_REPOSITORY)
    private readonly repo: IOrganizationRepository,
  ) {}

  @Post()
  @Roles('SUPER_ADMIN', 'SUPPORT')
  create(@Body() dto: CreateOrganizationDto) {
    return this.createOrg.execute(dto)
  }

  @Get()
  @Roles('SUPER_ADMIN', 'SUPPORT')
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findAll(
    @Query('status') status?: 'ACTIVE' | 'SUSPENDED' | 'CANCELED',
    @Query('search') search?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.listOrgs.execute({ status, search, page: Number(page) || 1, limit: Number(limit) || 20 })
  }

  @Get(':id')
  @Roles('SUPER_ADMIN', 'SUPPORT')
  findOne(@Param('id') id: string) {
    return this.repo.findById(id)
  }

  @Patch(':id')
  @Roles('SUPER_ADMIN', 'SUPPORT')
  update(@Param('id') id: string, @Body() dto: UpdateOrganizationDto) {
    return this.repo.update(id, dto)
  }

  @Patch(':id/status')
  @Roles('SUPER_ADMIN', 'SUPPORT')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateOrgStatusDto) {
    return this.updateOrgStatus.execute(id, dto.status)
  }

  @Delete(':id')
  @Roles('SUPER_ADMIN')
  remove(@Param('id') id: string) {
    return this.repo.delete(id)
  }
}
