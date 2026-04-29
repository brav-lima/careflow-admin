import { ForbiddenException } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { ExecutionContext } from '@nestjs/common'
import { RolesGuard } from './roles.guard'
import { ROLES_KEY } from '../decorators/roles.decorator'

const makeContext = (userRole: string, requiredRoles: string[] | undefined): ExecutionContext => {
  const reflector = new Reflector()
  jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(requiredRoles as any)

  return {
    getHandler: jest.fn(),
    getClass: jest.fn(),
    switchToHttp: () => ({
      getRequest: () => ({ user: { role: userRole } }),
    }),
  } as any
}

describe('RolesGuard', () => {
  let reflector: jest.Mocked<Reflector>
  let sut: RolesGuard

  beforeEach(() => {
    reflector = { getAllAndOverride: jest.fn() } as any
    sut = new RolesGuard(reflector)
  })

  it('allows access when no roles are required', () => {
    reflector.getAllAndOverride.mockReturnValue(undefined)
    const ctx = {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({ getRequest: () => ({ user: { role: 'SUPPORT' } }) }),
    } as any

    expect(sut.canActivate(ctx)).toBe(true)
  })

  it('allows access when user role matches a required role', () => {
    reflector.getAllAndOverride.mockReturnValue(['SUPER_ADMIN', 'SUPPORT'])
    const ctx = {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({ getRequest: () => ({ user: { role: 'SUPPORT' } }) }),
    } as any

    expect(sut.canActivate(ctx)).toBe(true)
  })

  it('throws ForbiddenException when user role is not in required roles', () => {
    reflector.getAllAndOverride.mockReturnValue(['SUPER_ADMIN'])
    const ctx = {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({ getRequest: () => ({ user: { role: 'SUPPORT' } }) }),
    } as any

    expect(() => sut.canActivate(ctx)).toThrow(ForbiddenException)
  })

  it('uses ROLES_KEY to read metadata', () => {
    reflector.getAllAndOverride.mockReturnValue(['SUPER_ADMIN'])
    const handler = jest.fn()
    const cls = jest.fn()
    const ctx = {
      getHandler: () => handler,
      getClass: () => cls,
      switchToHttp: () => ({ getRequest: () => ({ user: { role: 'SUPER_ADMIN' } }) }),
    } as any

    sut.canActivate(ctx)

    expect(reflector.getAllAndOverride).toHaveBeenCalledWith(ROLES_KEY, [handler, cls])
  })
})
