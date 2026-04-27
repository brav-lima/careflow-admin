import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common'
import { IOrganizationRepository, ORGANIZATION_REPOSITORY } from '../domain/organization.repository'

@Injectable()
export class ResolveClinicId {
  constructor(
    @Inject(ORGANIZATION_REPOSITORY)
    private readonly repo: IOrganizationRepository,
  ) {}

  async byOrganizationId(organizationId: string): Promise<string> {
    const org = await this.repo.findById(organizationId)
    if (!org) throw new NotFoundException('Organização não encontrada')
    if (!org.clinicExternalId) {
      throw new BadRequestException('Organização não está vinculada a uma clínica no pelvi-ui')
    }
    return org.clinicExternalId
  }
}
