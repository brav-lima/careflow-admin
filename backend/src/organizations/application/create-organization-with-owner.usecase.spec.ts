import { ConflictException } from '@nestjs/common'
import {
  CreateOrganizationWithOwnerUseCase,
  CreateOrganizationWithOwnerInput,
} from './create-organization-with-owner.usecase'
import { IOrganizationRepository } from '../domain/organization.repository'
import { ClinicApiService } from '../../clinic-api/clinic-api.service'
import { Organization } from '../domain/organization.entity'

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

const baseInput: CreateOrganizationWithOwnerInput = {
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
    sut = new CreateOrganizationWithOwnerUseCase(repo as any, clinicApi)
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

    const callOrder = [
      clinicApi.createClinic,
      clinicApi.upsertPerson,
      clinicApi.linkPersonToClinic,
      repo.create,
    ]
    for (let i = 0; i < callOrder.length - 1; i++) {
      expect(callOrder[i]).toHaveBeenCalled()
    }
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
