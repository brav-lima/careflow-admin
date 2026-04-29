import { UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'
import * as bcrypt from 'bcrypt'
import { AuthService } from './auth.service'

const mockUser = {
  id: 'user-1',
  name: 'Admin',
  email: 'admin@test.com',
  role: 'SUPER_ADMIN',
  active: true,
  passwordHash: '$2b$10$placeholder',
}

const mockRefreshToken = {
  id: 'rt-1',
  userId: 'user-1',
  tokenHash: 'some-hash',
  revokedAt: null,
  expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
}

const makePrisma = () => ({
  adminUser: {
    findUnique: jest.fn(),
  },
  adminRefreshToken: {
    findUnique: jest.fn(),
    create: jest.fn().mockResolvedValue({}),
    update: jest.fn().mockResolvedValue({}),
    updateMany: jest.fn().mockResolvedValue({}),
  },
})

describe('AuthService', () => {
  let prisma: ReturnType<typeof makePrisma>
  let jwt: jest.Mocked<JwtService>
  let config: jest.Mocked<ConfigService>
  let sut: AuthService

  beforeEach(() => {
    prisma = makePrisma()
    jwt = { sign: jest.fn().mockReturnValue('signed-token') } as any
    config = { getOrThrow: jest.fn().mockReturnValue('refresh-secret') } as any
    sut = new AuthService(prisma as any, jwt, config)
  })

  // ── login ──────────────────────────────────────────────────────────────
  describe('login', () => {
    it('throws UnauthorizedException when user is not found', async () => {
      prisma.adminUser.findUnique.mockResolvedValue(null)
      await expect(sut.login({ email: 'x@x.com', password: 'pw' })).rejects.toThrow(
        UnauthorizedException,
      )
    })

    it('throws UnauthorizedException when user is inactive', async () => {
      prisma.adminUser.findUnique.mockResolvedValue({ ...mockUser, active: false })
      await expect(sut.login({ email: mockUser.email, password: 'pw' })).rejects.toThrow(
        UnauthorizedException,
      )
    })

    it('throws UnauthorizedException when password is wrong', async () => {
      prisma.adminUser.findUnique.mockResolvedValue(mockUser)
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never)
      await expect(sut.login({ email: mockUser.email, password: 'wrong' })).rejects.toThrow(
        UnauthorizedException,
      )
    })

    it('returns tokens and user data on valid credentials', async () => {
      prisma.adminUser.findUnique.mockResolvedValue(mockUser)
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never)

      const result = await sut.login({ email: mockUser.email, password: 'correct' })

      expect(result.accessToken).toBeDefined()
      expect(result.refreshToken).toBeDefined()
      expect(result.user).toMatchObject({
        id: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
      })
    })
  })

  // ── getMe ──────────────────────────────────────────────────────────────
  describe('getMe', () => {
    it('returns user profile when found', async () => {
      const profile = { id: 'user-1', name: 'Admin', email: 'admin@test.com', role: 'SUPER_ADMIN', createdAt: new Date() }
      prisma.adminUser.findUnique.mockResolvedValue(profile)
      const result = await sut.getMe('user-1')
      expect(result).toEqual(profile)
    })

    it('throws UnauthorizedException when user is not found', async () => {
      prisma.adminUser.findUnique.mockResolvedValue(null)
      await expect(sut.getMe('missing')).rejects.toThrow(UnauthorizedException)
    })
  })

  // ── rotateRefreshToken ─────────────────────────────────────────────────
  describe('rotateRefreshToken', () => {
    it('throws when stored token is not found or belongs to a different user', async () => {
      prisma.adminRefreshToken.findUnique.mockResolvedValue(null)
      await expect(sut.rotateRefreshToken('user-1', 'some-jti')).rejects.toThrow(
        UnauthorizedException,
      )
    })

    it('throws and revokes family when token was already rotated (reuse detection)', async () => {
      prisma.adminRefreshToken.findUnique.mockResolvedValue({
        ...mockRefreshToken,
        revokedAt: new Date(),
      })

      await expect(sut.rotateRefreshToken('user-1', 'some-jti')).rejects.toThrow(
        UnauthorizedException,
      )
      expect(prisma.adminRefreshToken.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ userId: 'user-1', revokedAt: null }) }),
      )
    })

    it('throws when token is expired', async () => {
      prisma.adminRefreshToken.findUnique.mockResolvedValue({
        ...mockRefreshToken,
        expiresAt: new Date(Date.now() - 1000),
      })

      await expect(sut.rotateRefreshToken('user-1', 'some-jti')).rejects.toThrow(
        UnauthorizedException,
      )
    })

    it('throws when user is inactive', async () => {
      prisma.adminRefreshToken.findUnique.mockResolvedValue(mockRefreshToken)
      prisma.adminUser.findUnique.mockResolvedValue({ ...mockUser, active: false })

      await expect(sut.rotateRefreshToken('user-1', 'some-jti')).rejects.toThrow(
        UnauthorizedException,
      )
    })

    it('revokes old token and returns new tokens on valid rotation', async () => {
      prisma.adminRefreshToken.findUnique.mockResolvedValue(mockRefreshToken)
      prisma.adminUser.findUnique.mockResolvedValue(mockUser)

      const result = await sut.rotateRefreshToken('user-1', 'some-jti')

      expect(prisma.adminRefreshToken.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'rt-1' }, data: expect.objectContaining({ revokedAt: expect.any(Date) }) }),
      )
      expect(result.accessToken).toBeDefined()
      expect(result.refreshToken).toBeDefined()
    })
  })

  // ── revokeRefreshToken ─────────────────────────────────────────────────
  describe('revokeRefreshToken', () => {
    it('calls updateMany to mark the token as revoked', async () => {
      await sut.revokeRefreshToken('some-jti')
      expect(prisma.adminRefreshToken.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ revokedAt: expect.any(Date) }),
        }),
      )
    })
  })
})
