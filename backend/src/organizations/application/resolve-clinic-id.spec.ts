import { BadRequestException, NotFoundException } from '@nestjs/common'
import { ResolveClinicId } from './resolve-clinic-id'
import { IOrganizationRepository } from '../domain/organization.repository'
import { Organization } from '../domain/organization.entity'

const makeOrg = (overrides: Partial<Organization> = {}): Organization => ({
  id: 'org-1',
  name: 'Clínica Teste',
  document: '12345678000100',
  email: 'clinic@test.com',
  phone: null,
  status: 'ACTIVE',
  clinicExternalId: 'clinic-ext-1',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
})

describe('ResolveClinicId', () => {
  let repo: jest.Mocked<IOrganizationRepository>
  let sut: ResolveClinicId

  beforeEach(() => {
    repo = {
      findById: jest.fn(),
      findAll: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    }
    sut = new ResolveClinicId(repo as any)
  })

  it('returns clinicExternalId when organization is found and linked', async () => {
    repo.findById.mockResolvedValue(makeOrg())
    const result = await sut.byOrganizationId('org-1')
    expect(result).toBe('clinic-ext-1')
  })

  it('throws NotFoundException when organization does not exist', async () => {
    repo.findById.mockResolvedValue(null)
    await expect(sut.byOrganizationId('missing')).rejects.toThrow(NotFoundException)
  })

  it('throws BadRequestException when organization has no clinicExternalId', async () => {
    repo.findById.mockResolvedValue(makeOrg({ clinicExternalId: null }))
    await expect(sut.byOrganizationId('org-1')).rejects.toThrow(BadRequestException)
  })
})
