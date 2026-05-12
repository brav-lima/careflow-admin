import { ServiceUnavailableException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { ClinicApiService } from './clinic-api.service'

const makeConfig = (clinicApiUrl: string) =>
  ({ getOrThrow: (key: string) => (key === 'CLINIC_API_URL' ? clinicApiUrl : 'test-key') }) as ConfigService

const buildUrl = (svc: ClinicApiService, template: TemplateStringsArray, ...segments: string[]) =>
  (svc as any).buildUrl(template, ...segments)

const tpl = (str: string): TemplateStringsArray =>
  Object.assign([str], { raw: [str] }) as unknown as TemplateStringsArray

describe('ClinicApiService', () => {
  describe('buildUrl — SSRF guard', () => {
    it('returns a valid URL when path is safe', () => {
      const svc = new ClinicApiService(makeConfig('http://localhost:3000'))
      const url = buildUrl(svc, tpl('/api/internal/clinics'))
      expect(url).toBe('http://localhost:3000/api/internal/clinics')
    })

    it('URI-encodes dynamic path segments', () => {
      const svc = new ClinicApiService(makeConfig('http://localhost:3000'))
      const template = Object.assign(['/api/internal/clinics/', '/users'], { raw: ['/api/internal/clinics/', '/users'] }) as unknown as TemplateStringsArray
      const url = buildUrl(svc, template, 'a b/c')
      expect(url).toBe('http://localhost:3000/api/internal/clinics/a%20b%2Fc/users')
    })

    it('throws when a template path changes the URL origin (SSRF via credential injection)', () => {
      // http://localhost:3000@evil.com/api resolves origin to evil.com
      const svc = new ClinicApiService(makeConfig('http://localhost:3000'))
      expect(() => buildUrl(svc, tpl('@evil.com/api'))).toThrow(ServiceUnavailableException)
    })

    it('strips trailing slash from base URL before appending path', () => {
      const svc = new ClinicApiService(makeConfig('http://localhost:3000/'))
      const url = buildUrl(svc, tpl('/api/internal/clinics'))
      expect(url).toBe('http://localhost:3000/api/internal/clinics')
    })

    it('builds multi-segment URLs correctly', () => {
      const svc = new ClinicApiService(makeConfig('http://localhost:3000'))
      const template = Object.assign(
        ['/api/internal/clinics/', '/users/', '/reset-password'],
        { raw: ['/api/internal/clinics/', '/users/', '/reset-password'] },
      ) as unknown as TemplateStringsArray
      const url = buildUrl(svc, template, 'clinic-id', 'user-id')
      expect(url).toBe('http://localhost:3000/api/internal/clinics/clinic-id/users/user-id/reset-password')
    })
  })
})
