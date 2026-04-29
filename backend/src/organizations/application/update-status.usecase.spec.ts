import { NotFoundException } from '@nestjs/common'
import { UpdateOrgStatusUseCase } from './update-status.usecase'
import { IOrganizationRepository } from '../domain/organization.repository'
import { ClinicApiService } from '../../clinic-api/clinic-api.service'
import { Organization, OrgStatus } from '../domain/organization.entity'

const makeOrg = (overrides: Partial<Organization> = {}): Organization => ({
  id: 'org-1',
  name: 'Clínica A',
  document: '12345678000100',
  email: 'a@test.com',
  phone: null,
  status: 'ACTIVE',
  clinicExternalId: 'clinic-1',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
})

const makePrisma = (sub: object | null = null) => ({
  subscription: {
    findFirst: jest.fn().mockResolvedValue(sub),
  },
})

describe('UpdateOrgStatusUseCase', () => {
  let repo: jest.Mocked<IOrganizationRepository>
  let clinicApi: jest.Mocked<ClinicApiService>
  let prisma: ReturnType<typeof makePrisma>
  let sut: UpdateOrgStatusUseCase

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
      updateClinicAccess: jest.fn(),
      upsertPerson: jest.fn(),
      linkPersonToClinic: jest.fn(),
      listClinics: jest.fn(),
      listClinicUsers: jest.fn(),
      updateClinicUser: jest.fn(),
      resetClinicUserPassword: jest.fn(),
    } as any
    prisma = makePrisma()
    sut = new UpdateOrgStatusUseCase(repo as any, clinicApi, prisma as any)
  })

  it('throws NotFoundException when organization does not exist', async () => {
    repo.findById.mockResolvedValue(null)
    await expect(sut.execute('missing', 'ACTIVE')).rejects.toThrow(NotFoundException)
  })

  it('calls updateClinicAccess with ACTIVE when status is ACTIVE', async () => {
    repo.findById.mockResolvedValue(makeOrg())
    repo.update.mockResolvedValue(makeOrg({ status: 'ACTIVE' }))

    await sut.execute('org-1', 'ACTIVE')

    expect(clinicApi.updateClinicAccess).toHaveBeenCalledWith(
      'clinic-1',
      'ACTIVE',
      undefined,
    )
  })

  it.each<[OrgStatus, string]>([
    ['SUSPENDED', 'BLOCKED'],
    ['CANCELED', 'BLOCKED'],
  ])('maps org status %s → clinic access %s', async (orgStatus, clinicAccess) => {
    repo.findById.mockResolvedValue(makeOrg())
    repo.update.mockResolvedValue(makeOrg({ status: orgStatus }))

    await sut.execute('org-1', orgStatus)

    expect(clinicApi.updateClinicAccess).toHaveBeenCalledWith(
      'clinic-1',
      clinicAccess,
      undefined,
    )
  })

  it('passes plan limits from active subscription to updateClinicAccess', async () => {
    const sub = { plan: { maxUsers: 10, maxPatients: 500 } }
    prisma = makePrisma(sub)
    sut = new UpdateOrgStatusUseCase(repo as any, clinicApi, prisma as any)

    repo.findById.mockResolvedValue(makeOrg())
    repo.update.mockResolvedValue(makeOrg())

    await sut.execute('org-1', 'ACTIVE')

    expect(clinicApi.updateClinicAccess).toHaveBeenCalledWith('clinic-1', 'ACTIVE', {
      maxUsers: 10,
      maxPatients: 500,
    })
  })

  it('skips clinic sync when org has no clinicExternalId', async () => {
    repo.findById.mockResolvedValue(makeOrg({ clinicExternalId: null }))
    repo.update.mockResolvedValue(makeOrg({ clinicExternalId: null, status: 'SUSPENDED' }))

    await sut.execute('org-1', 'SUSPENDED')

    expect(clinicApi.updateClinicAccess).not.toHaveBeenCalled()
  })

  it('persists the new status via repo.update', async () => {
    repo.findById.mockResolvedValue(makeOrg())
    repo.update.mockResolvedValue(makeOrg({ status: 'SUSPENDED' }))

    await sut.execute('org-1', 'SUSPENDED')

    expect(repo.update).toHaveBeenCalledWith('org-1', { status: 'SUSPENDED' })
  })
})
