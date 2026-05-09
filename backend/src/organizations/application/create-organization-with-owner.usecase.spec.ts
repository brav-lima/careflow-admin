import { ConflictException } from '@nestjs/common'
import {
  CreateOrganizationWithOwnerUseCase,
  CreateOrganizationWithOwnerInput,
} from './create-organization-with-owner.usecase'
import { IOrganizationRepository } from '../domain/organization.repository'
import { ClinicApiService } from '../../clinic-api/clinic-api.service'
import { PrismaService } from '../../prisma/prisma.service'
import { ResolveTrialPlan } from './resolve-trial-plan'
import { Organization } from '../domain/organization.entity'

const makeOrg = (overrides: Partial<Organization> = {}): Organization => ({
  id: 'org-1',
  name: 'Clínica A',
  document: '12345678000100',
  documentType: 'CNPJ',
  email: 'a@test.com',
  phone: null,
  status: 'ACTIVE',
  clinicExternalId: 'clinic-1',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
})

const makeSub = () => ({
  id: 'sub-1',
  status: 'TRIAL',
  trialEndsAt: new Date(Date.now() + 14 * 86400000),
})

const baseInput: CreateOrganizationWithOwnerInput = {
  organizationType: 'CLINIC_PJ',
  name: 'Clínica A',
  document: '12345678000100',
  email: 'a@test.com',
  phone: '11999990000',
  owner: {
    name: 'Ana Lima',
    cpf: '12345678900',
    email: 'ana@test.com',
    phone: '11988880000',
  },
}

const personResp = (reused = false) => ({
  reused,
  person: {
    personId: 'person-1',
    cpf: '12345678900',
    name: 'Ana Lima',
    email: 'ana@test.com',
  },
})

describe('CreateOrganizationWithOwnerUseCase', () => {
  let repo: jest.Mocked<IOrganizationRepository>
  let clinicApi: jest.Mocked<ClinicApiService>
  let prisma: jest.Mocked<Pick<PrismaService, 'subscription' | 'plan'>>
  let resolveTrialPlan: jest.Mocked<ResolveTrialPlan>
  let sut: CreateOrganizationWithOwnerUseCase

  beforeEach(() => {
    repo = {
      findById: jest.fn(),
      findAll: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    }
    clinicApi = {
      createClinic: jest.fn(),
      listClinics: jest.fn(),
      updateClinicAccess: jest.fn(),
      upsertPerson: jest.fn(),
      linkPersonToClinic: jest.fn(),
      listClinicUsers: jest.fn(),
      updateClinicUser: jest.fn(),
      resetClinicUserPassword: jest.fn(),
    } as any
    prisma = {
      subscription: { create: jest.fn().mockResolvedValue(makeSub()) } as any,
      plan: { findUniqueOrThrow: jest.fn().mockResolvedValue({ maxUsers: 5, maxPatients: 100 }) } as any,
    }
    resolveTrialPlan = { planId: jest.fn().mockResolvedValue('plan-trial-id') } as any

    sut = new CreateOrganizationWithOwnerUseCase(
      repo as any,
      clinicApi,
      prisma as any,
      resolveTrialPlan,
    )
  })

  it('throws ConflictException when document already belongs to an org', async () => {
    repo.findAll.mockResolvedValue({ data: [makeOrg()], total: 1 })
    await expect(sut.execute(baseInput)).rejects.toThrow(ConflictException)
  })

  it('executes the full creation flow in order', async () => {
    repo.findAll.mockResolvedValue({ data: [], total: 0 })
    clinicApi.createClinic.mockResolvedValue({ clinicId: 'clinic-new' } as any)
    clinicApi.upsertPerson.mockResolvedValue(personResp(false) as any)
    clinicApi.linkPersonToClinic.mockResolvedValue(undefined as any)
    repo.create.mockResolvedValue(makeOrg({ clinicExternalId: 'clinic-new' }))

    await sut.execute(baseInput)

    expect(clinicApi.createClinic).toHaveBeenCalled()
    expect(clinicApi.upsertPerson).toHaveBeenCalled()
    expect(clinicApi.linkPersonToClinic).toHaveBeenCalled()
    expect(repo.create).toHaveBeenCalled()
    expect(prisma.subscription.create).toHaveBeenCalled()
  })

  it('creates TRIAL subscription with 14-day trialEndsAt', async () => {
    repo.findAll.mockResolvedValue({ data: [], total: 0 })
    clinicApi.createClinic.mockResolvedValue({ clinicId: 'clinic-new' } as any)
    clinicApi.upsertPerson.mockResolvedValue(personResp(false) as any)
    clinicApi.linkPersonToClinic.mockResolvedValue(undefined as any)
    repo.create.mockResolvedValue(makeOrg({ id: 'org-new' }))

    await sut.execute(baseInput)

    expect(prisma.subscription.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          organizationId: 'org-new',
          planId: 'plan-trial-id',
          status: 'TRIAL',
        }),
      }),
    )
  })

  it('returns subscription info in result', async () => {
    repo.findAll.mockResolvedValue({ data: [], total: 0 })
    clinicApi.createClinic.mockResolvedValue({ clinicId: 'clinic-new' } as any)
    clinicApi.upsertPerson.mockResolvedValue(personResp(false) as any)
    clinicApi.linkPersonToClinic.mockResolvedValue(undefined as any)
    repo.create.mockResolvedValue(makeOrg())

    const result = await sut.execute(baseInput)

    expect(result.subscription).toMatchObject({ id: 'sub-1', status: 'TRIAL' })
  })

  it('returns provisionalPassword when person is newly created', async () => {
    repo.findAll.mockResolvedValue({ data: [], total: 0 })
    clinicApi.createClinic.mockResolvedValue({ clinicId: 'clinic-new' } as any)
    clinicApi.upsertPerson.mockResolvedValue(personResp(false) as any)
    clinicApi.linkPersonToClinic.mockResolvedValue(undefined as any)
    repo.create.mockResolvedValue(makeOrg())

    const result = await sut.execute(baseInput)

    expect(result.provisionalPassword).not.toBeNull()
    expect(typeof result.provisionalPassword).toBe('string')
  })

  it('returns null provisionalPassword when person already existed (reused)', async () => {
    repo.findAll.mockResolvedValue({ data: [], total: 0 })
    clinicApi.createClinic.mockResolvedValue({ clinicId: 'clinic-new' } as any)
    clinicApi.upsertPerson.mockResolvedValue(personResp(true) as any)
    clinicApi.linkPersonToClinic.mockResolvedValue(undefined as any)
    repo.create.mockResolvedValue(makeOrg())

    const result = await sut.execute(baseInput)

    expect(result.provisionalPassword).toBeNull()
    expect(result.owner.reused).toBe(true)
  })

  it('links person to clinic with ADMIN role', async () => {
    repo.findAll.mockResolvedValue({ data: [], total: 0 })
    clinicApi.createClinic.mockResolvedValue({ clinicId: 'clinic-new' } as any)
    clinicApi.upsertPerson.mockResolvedValue(personResp(false) as any)
    clinicApi.linkPersonToClinic.mockResolvedValue(undefined as any)
    repo.create.mockResolvedValue(makeOrg())

    await sut.execute(baseInput)

    expect(clinicApi.linkPersonToClinic).toHaveBeenCalledWith(
      'clinic-new',
      expect.objectContaining({ personId: 'person-1', role: 'ADMIN' }),
    )
  })
})
