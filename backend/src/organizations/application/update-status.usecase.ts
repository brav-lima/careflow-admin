import { Injectable, Inject, NotFoundException } from '@nestjs/common'
import { IOrganizationRepository, ORGANIZATION_REPOSITORY } from '../domain/organization.repository'
import { Organization, OrgStatus } from '../domain/organization.entity'
import { ClinicApiService, ClinicAccessStatus } from '../../clinic-api/clinic-api.service'
import { PrismaService } from '../../prisma/prisma.service'
import { OrgEventService } from './org-event.service'

const orgStatusToClinicAccess: Record<OrgStatus, ClinicAccessStatus> = {
  ACTIVE: 'ACTIVE',
  SUSPENDED: 'BLOCKED',
  CANCELED: 'BLOCKED',
}

@Injectable()
export class UpdateOrgStatusUseCase {
  constructor(
    @Inject(ORGANIZATION_REPOSITORY)
    private readonly repo: IOrganizationRepository,
    private readonly clinicApi: ClinicApiService,
    private readonly prisma: PrismaService,
    private readonly orgEvents: OrgEventService,
  ) {}

  async execute(id: string, status: OrgStatus): Promise<Organization> {
    const org = await this.repo.findById(id)
    if (!org) throw new NotFoundException('Organização não encontrada')

    if (org.clinicExternalId) {
      // Busca assinatura ativa para obter limites do plano
      const sub = await this.prisma.subscription.findFirst({
        where: { organizationId: id, status: { in: ['ACTIVE', 'TRIAL'] } },
        include: { plan: true },
      })
      const limits = sub
        ? { maxUsers: sub.plan.maxUsers, maxPatients: sub.plan.maxPatients }
        : undefined

      await this.clinicApi.updateClinicAccess(
        org.clinicExternalId,
        orgStatusToClinicAccess[status],
        limits,
      )
    }

    const updated = await this.repo.update(id, { status })
    await this.orgEvents.record(id, 'STATUS_CHANGED', {
      from: org.status,
      to: status,
    })
    return updated
  }
}
