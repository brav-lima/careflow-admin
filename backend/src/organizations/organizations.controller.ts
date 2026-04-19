import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Query, UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiTags, ApiQuery } from '@nestjs/swagger'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../auth/guards/roles.guard'
import { Roles } from '../auth/decorators/roles.decorator'
import { CreateOrganizationUseCase } from './application/create-organization.usecase'
import { CreateOrganizationWithOwnerUseCase } from './application/create-organization-with-owner.usecase'
import { UpdateOrgStatusUseCase } from './application/update-status.usecase'
import { ListOrganizationsUseCase } from './application/list-organizations.usecase'
import { ResetClinicUserPasswordUseCase } from './application/reset-clinic-user-password.usecase'
import { ResolveClinicId } from './application/resolve-clinic-id'
import { CreateOrganizationDto } from './dto/create-organization.dto'
import { CreateOrganizationWithOwnerDto } from './dto/create-organization-with-owner.dto'
import { UpdateOrganizationDto, UpdateOrgStatusDto } from './dto/update-organization.dto'
import { UpdateClinicUserDto } from './dto/update-clinic-user.dto'
import { Inject } from '@nestjs/common'
import { IOrganizationRepository, ORGANIZATION_REPOSITORY } from './domain/organization.repository'
import { ClinicApiService } from '../clinic-api/clinic-api.service'

@ApiTags('organizations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('organizations')
export class OrganizationsController {
  constructor(
    private readonly createOrg: CreateOrganizationUseCase,
    private readonly createOrgWithOwner: CreateOrganizationWithOwnerUseCase,
    private readonly updateOrgStatus: UpdateOrgStatusUseCase,
    private readonly listOrgs: ListOrganizationsUseCase,
    private readonly resetClinicUserPassword: ResetClinicUserPasswordUseCase,
    private readonly resolveClinicId: ResolveClinicId,
    private readonly clinicApi: ClinicApiService,
    @Inject(ORGANIZATION_REPOSITORY)
    private readonly repo: IOrganizationRepository,
  ) {}

  @Get('available-clinics')
  @Roles('SUPER_ADMIN', 'SUPPORT')
  availableClinics() {
    return this.clinicApi.listClinics()
  }

  @Post()
  @Roles('SUPER_ADMIN', 'SUPPORT')
  create(@Body() dto: CreateOrganizationDto) {
    return this.createOrg.execute(dto)
  }

  @Post('with-owner')
  @Roles('SUPER_ADMIN', 'SUPPORT')
  createWithOwner(@Body() dto: CreateOrganizationWithOwnerDto) {
    return this.createOrgWithOwner.execute(dto)
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

  // ─── Usuários da clínica (via clinic-api) ───────────────────

  @Get(':id/users')
  @Roles('SUPER_ADMIN', 'SUPPORT')
  async listClinicUsers(@Param('id') id: string) {
    const clinicId = await this.resolveClinicId.byOrganizationId(id)
    return this.clinicApi.listClinicUsers(clinicId)
  }

  @Patch(':id/users/:organizationUserId')
  @Roles('SUPER_ADMIN', 'SUPPORT')
  async updateClinicUser(
    @Param('id') id: string,
    @Param('organizationUserId') organizationUserId: string,
    @Body() dto: UpdateClinicUserDto,
  ) {
    const clinicId = await this.resolveClinicId.byOrganizationId(id)
    return this.clinicApi.updateClinicUser(clinicId, organizationUserId, dto)
  }

  @Post(':id/users/:organizationUserId/reset-password')
  @Roles('SUPER_ADMIN', 'SUPPORT')
  resetUserPassword(
    @Param('id') id: string,
    @Param('organizationUserId') organizationUserId: string,
  ) {
    return this.resetClinicUserPassword.execute(id, organizationUserId)
  }
}
