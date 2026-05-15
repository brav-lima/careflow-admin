import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, ParseUUIDPipe, Query, UseGuards, NotFoundException,
} from '@nestjs/common'
import { ApiBearerAuth, ApiTags, ApiQuery } from '@nestjs/swagger'
import { Throttle } from '@nestjs/throttler'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../auth/guards/roles.guard'
import { Roles } from '../auth/decorators/roles.decorator'
import { AdminThrottlerGuard } from '../common/guards/admin-throttler.guard'
import { IpThrottlerGuard } from '../common/guards/ip-throttler.guard'
import { CreateOrganizationUseCase } from './application/create-organization.usecase'
import { CreateOrganizationWithOwnerUseCase } from './application/create-organization-with-owner.usecase'
import { UpdateOrgStatusUseCase } from './application/update-status.usecase'
import { ListOrganizationsUseCase } from './application/list-organizations.usecase'
import { ResetClinicUserPasswordUseCase } from './application/reset-clinic-user-password.usecase'
import { ResolveClinicId } from './application/resolve-clinic-id'
import { OrgEventService } from './application/org-event.service'
import { CreateOrganizationDto } from './dto/create-organization.dto'
import { CreateOrganizationInputDto } from './dto/create-organization-input.dto'
import { OrganizationType } from './dto/create-organization-with-owner.dto'
import { UpdateOrganizationDto } from './dto/update-organization.dto'
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
    private readonly orgEvents: OrgEventService,
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
  create(@Body() dto: CreateOrganizationInputDto) {
    if (dto.owner) {
      return this.createOrgWithOwner.execute({
        organizationType: dto.organizationType ?? OrganizationType.CLINIC_PJ,
        name: dto.name,
        document: dto.document,
        email: dto.email,
        phone: dto.phone,
        owner: dto.owner,
      })
    }
    return this.createOrg.execute(dto as CreateOrganizationDto)
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
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const org = await this.repo.findById(id)
    if (!org) throw new NotFoundException('Organização não encontrada')

    let userCount: number | null = null
    if (org.clinicExternalId) {
      try {
        const users = await this.clinicApi.listClinicUsers(org.clinicExternalId)
        userCount = users.length
      } catch {
        // clinic-api unavailable — return null, don't break the page
      }
    }

    return { ...org, userCount }
  }

  @Patch(':id')
  @Roles('SUPER_ADMIN', 'SUPPORT')
  async update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateOrganizationDto) {
    if (dto.status) {
      return this.updateOrgStatus.execute(id, dto.status)
    }
    return this.repo.update(id, dto)
  }

  @Delete(':id')
  @Roles('SUPER_ADMIN')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.repo.delete(id)
  }

  // ─── Timeline de eventos ─────────────────────────────────────

  @Get(':id/events')
  @Roles('SUPER_ADMIN', 'SUPPORT')
  @ApiQuery({ name: 'limit', required: false, type: Number })
  listEvents(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('limit') limit?: number,
  ) {
    return this.orgEvents.list(id, Number(limit) || 20)
  }

  // ─── Usuários da clínica (via clinic-api) ───────────────────

  @Get(':id/users')
  @Roles('SUPER_ADMIN', 'SUPPORT')
  async listClinicUsers(@Param('id', ParseUUIDPipe) id: string) {
    const clinicId = await this.resolveClinicId.byOrganizationId(id)
    return this.clinicApi.listClinicUsers(clinicId)
  }

  @Patch(':id/users/:organizationUserId')
  @Roles('SUPER_ADMIN', 'SUPPORT')
  async updateClinicUser(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('organizationUserId', ParseUUIDPipe) organizationUserId: string,
    @Body() dto: UpdateClinicUserDto,
  ) {
    const clinicId = await this.resolveClinicId.byOrganizationId(id)
    return this.clinicApi.updateClinicUser(clinicId, organizationUserId, dto)
  }

  @Post(':id/users/:organizationUserId/password-resets')
  @Roles('SUPER_ADMIN', 'SUPPORT')
  @UseGuards(AdminThrottlerGuard, IpThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 600_000 }, 'reset-ip': { limit: 20, ttl: 3_600_000 } })
  resetUserPassword(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('organizationUserId', ParseUUIDPipe) organizationUserId: string,
  ) {
    return this.resetClinicUserPassword.execute(id, organizationUserId)
  }
}
