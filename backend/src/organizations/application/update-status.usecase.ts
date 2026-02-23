import { Injectable, Inject, NotFoundException } from '@nestjs/common'
import { IOrganizationRepository, ORGANIZATION_REPOSITORY } from '../domain/organization.repository'
import { Organization, OrgStatus } from '../domain/organization.entity'
import { ClinicApiService, ClinicAccessStatus } from '../../clinic-api/clinic-api.service'

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
  ) {}

  async execute(id: string, status: OrgStatus): Promise<Organization> {
    const org = await this.repo.findById(id)
    if (!org) throw new NotFoundException('Organização não encontrada')

    // Propaga a mudança de acesso ao careflow antes de salvar localmente
    if (org.clinicExternalId) {
      await this.clinicApi.updateClinicAccess(
        org.clinicExternalId,
        orgStatusToClinicAccess[status],
      )
    }

    return this.repo.update(id, { status })
  }
}
