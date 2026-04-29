import { ConflictException } from '@nestjs/common'
import { CreateOrganizationUseCase, CreateOrganizationInput } from './create-organization.usecase'
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

const baseInput: CreateOrganizationInput = {
  name: 'Clínica A',
  document: '12345678000100',
  email: 'a@test.com',
  phone: '11999990000',
}

describe('CreateOrganizationUseCase', () => {
  let repo: jest.Mocked<IOrganizationRepository>
  let clinicApi: jest.Mocked<ClinicApiService>
  let sut: CreateOrganizationUseCase

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
    sut = new CreateOrganizationUseCase(repo as any, clinicApi)
  })

  it('throws ConflictException when CNPJ already exists', async () => {
    repo.findAll.mockResolvedValue({ data: [makeOrg()], total: 1 })
    await expect(sut.execute(baseInput)).rejects.toThrow(ConflictException)
  })

  it('creates a clinic in pelvi-ui and persists the organization', async () => {
    repo.findAll.mockResolvedValue({ data: [], total: 0 })
    clinicApi.createClinic.mockResolvedValue({ clinicId: 'clinic-new' } as any)
    const expected = makeOrg({ clinicExternalId: 'clinic-new' })
    repo.create.mockResolvedValue(expected)

    const result = await sut.execute(baseInput)

    expect(clinicApi.createClinic).toHaveBeenCalledWith({
      name: baseInput.name,
      document: baseInput.document,
      email: baseInput.email,
      phone: baseInput.phone,
    })
    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({ clinicExternalId: 'clinic-new', status: 'ACTIVE' }),
    )
    expect(result).toEqual(expected)
  })

  it('skips clinic creation when clinicExternalId is provided', async () => {
    repo.findAll.mockResolvedValue({ data: [], total: 0 })
    const expected = makeOrg({ clinicExternalId: 'existing-clinic' })
    repo.create.mockResolvedValue(expected)

    await sut.execute({ ...baseInput, clinicExternalId: 'existing-clinic' })

    expect(clinicApi.createClinic).not.toHaveBeenCalled()
    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({ clinicExternalId: 'existing-clinic' }),
    )
  })

  it('stores null phone when phone is omitted', async () => {
    repo.findAll.mockResolvedValue({ data: [], total: 0 })
    clinicApi.createClinic.mockResolvedValue({ clinicId: 'clinic-1' } as any)
    repo.create.mockResolvedValue(makeOrg({ phone: null }))

    const { phone: _p, ...inputWithoutPhone } = baseInput
    await sut.execute(inputWithoutPhone)

    expect(repo.create).toHaveBeenCalledWith(expect.objectContaining({ phone: null }))
  })
})
