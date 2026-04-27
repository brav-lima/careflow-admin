import { Injectable, Inject, ConflictException } from '@nestjs/common'
import { IOrganizationRepository, ORGANIZATION_REPOSITORY } from '../domain/organization.repository'
import { Organization } from '../domain/organization.entity'
import { ClinicApiService } from '../../clinic-api/clinic-api.service'

export interface CreateOrganizationInput {
  name: string
  document: string
  email: string
  phone?: string
  // Se fornecido, vincula a uma clínica já existente no pelvi-ui (não cria nova)
  clinicExternalId?: string
}

@Injectable()
export class CreateOrganizationUseCase {
  constructor(
    @Inject(ORGANIZATION_REPOSITORY)
    private readonly repo: IOrganizationRepository,
    private readonly clinicApi: ClinicApiService,
  ) {}

  async execute(input: CreateOrganizationInput): Promise<Organization> {
    const existing = await this.repo.findAll({ search: input.document, limit: 1 })
    if (existing.data.length > 0) {
      throw new ConflictException('Já existe uma organização com este CNPJ')
    }

    let clinicExternalId = input.clinicExternalId ?? null

    if (!clinicExternalId) {
      // Cria a clínica no pelvi-ui e obtém o ID externo
      const clinic = await this.clinicApi.createClinic({
        name: input.name,
        document: input.document,
        email: input.email,
        phone: input.phone,
      })
      clinicExternalId = clinic.clinicId
    }

    return this.repo.create({
      name: input.name,
      document: input.document,
      email: input.email,
      phone: input.phone ?? null,
      status: 'ACTIVE',
      clinicExternalId,
    })
  }
}
