import { ResetClinicUserPasswordUseCase } from './reset-clinic-user-password.usecase'
import { ClinicApiService } from '../../clinic-api/clinic-api.service'
import { ResolveClinicId } from './resolve-clinic-id'

describe('ResetClinicUserPasswordUseCase', () => {
  let clinicApi: jest.Mocked<ClinicApiService>
  let resolveClinicId: jest.Mocked<ResolveClinicId>
  let sut: ResetClinicUserPasswordUseCase

  beforeEach(() => {
    clinicApi = {
      resetClinicUserPassword: jest.fn().mockResolvedValue(undefined),
    } as any
    resolveClinicId = {
      byOrganizationId: jest.fn().mockResolvedValue('clinic-1'),
    } as any
    sut = new ResetClinicUserPasswordUseCase(clinicApi, resolveClinicId)
  })

  it('resolves clinic ID from organization ID before calling the API', async () => {
    await sut.execute('org-1', 'user-1')
    expect(resolveClinicId.byOrganizationId).toHaveBeenCalledWith('org-1')
  })

  it('calls resetClinicUserPassword with the resolved clinic ID and user ID', async () => {
    await sut.execute('org-1', 'user-1')
    expect(clinicApi.resetClinicUserPassword).toHaveBeenCalledWith(
      'clinic-1',
      'user-1',
      expect.any(String),
    )
  })

  it('returns the user ID and a non-empty provisional password', async () => {
    const result = await sut.execute('org-1', 'user-1')
    expect(result.organizationUserId).toBe('user-1')
    expect(result.provisionalPassword).toBeTruthy()
    expect(result.provisionalPassword.length).toBeGreaterThan(0)
  })

  it('propagates errors from resolveClinicId', async () => {
    resolveClinicId.byOrganizationId.mockRejectedValue(new Error('not found'))
    await expect(sut.execute('missing-org', 'user-1')).rejects.toThrow('not found')
  })
})
