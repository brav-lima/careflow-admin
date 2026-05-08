import { ConflictException, Inject, Injectable, Logger } from '@nestjs/common'
import { IOrganizationRepository, ORGANIZATION_REPOSITORY } from '../domain/organization.repository'
import { Organization } from '../domain/organization.entity'
import { ClinicApiService } from '../../clinic-api/clinic-api.service'
import { PrismaService } from '../../prisma/prisma.service'
import { ResolveTrialPlan } from './resolve-trial-plan'
import { generateProvisionalPassword } from './provisional-password'

export interface CreateOrganizationWithOwnerInput {
  name: string
  document: string
  email: string
  phone?: string
  owner: {
    name: string
    cpf: string
    email: string
    phone?: string
  }
}

export interface CreateOrganizationWithOwnerResult {
  organization: Organization
  owner: {
    personId: string
    cpf: string
    name: string
    email: string
    reused: boolean
  }
  subscription: {
    id: string
    status: string
    trialEndsAt: Date
  }
  // Retornado apenas quando a pessoa foi criada agora. UI deve exibir uma única vez.
  provisionalPassword: string | null
}

const TRIAL_DAYS = 14

@Injectable()
export class CreateOrganizationWithOwnerUseCase {
  private readonly logger = new Logger(CreateOrganizationWithOwnerUseCase.name)

  constructor(
    @Inject(ORGANIZATION_REPOSITORY)
    private readonly repo: IOrganizationRepository,
    private readonly clinicApi: ClinicApiService,
    private readonly prisma: PrismaService,
    private readonly resolveTrialPlan: ResolveTrialPlan,
  ) {}

  async execute(input: CreateOrganizationWithOwnerInput): Promise<CreateOrganizationWithOwnerResult> {
    const existing = await this.repo.findAll({ search: input.document, limit: 1 })
    const conflict = existing.data.find((o) => o.document === input.document)
    if (conflict) {
      throw new ConflictException('Já existe uma organização com este CNPJ')
    }

    const clinic = await this.clinicApi.createClinic({
      name: input.name,
      document: input.document,
      email: input.email,
      phone: input.phone,
    })

    const provisionalPassword = generateProvisionalPassword()
    const personResp = await this.clinicApi.upsertPerson({
      cpf: input.owner.cpf,
      name: input.owner.name,
      email: input.owner.email,
      phone: input.owner.phone,
      password: provisionalPassword,
    })

    await this.clinicApi.linkPersonToClinic(clinic.clinicId, {
      personId: personResp.person.personId,
      role: 'ADMIN',
    })

    const organization = await this.repo.create({
      name: input.name,
      document: input.document,
      email: input.email,
      phone: input.phone ?? null,
      status: 'ACTIVE',
      clinicExternalId: clinic.clinicId,
    })

    // Toda org nasce com subscription TRIAL de 14 dias
    const trialPlanId = await this.resolveTrialPlan.planId()
    const trialEndsAt = new Date(Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000)

    const subscription = await this.prisma.subscription.create({
      data: {
        organizationId: organization.id,
        planId: trialPlanId,
        status: 'TRIAL',
        startDate: new Date(),
        trialEndsAt,
      },
    })

    // Propaga limites do plano ao pelvi-ui
    const plan = await this.prisma.plan.findUniqueOrThrow({ where: { id: trialPlanId } })
    await this.clinicApi.updateClinicAccess(clinic.clinicId, 'ACTIVE', {
      maxUsers: plan.maxUsers,
      maxPatients: plan.maxPatients,
    })

    if (personResp.reused) {
      this.logger.log(`Owner reaproveitado (cpf=${input.owner.cpf}); senha provisória não foi redefinida.`)
    }

    return {
      organization,
      owner: {
        personId: personResp.person.personId,
        cpf: personResp.person.cpf,
        name: personResp.person.name,
        email: personResp.person.email,
        reused: personResp.reused,
      },
      subscription: {
        id: subscription.id,
        status: subscription.status,
        trialEndsAt: subscription.trialEndsAt!,
      },
      provisionalPassword: personResp.reused ? null : provisionalPassword,
    }
  }
}
