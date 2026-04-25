import { Injectable, UnauthorizedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import * as bcrypt from 'bcrypt'
import * as crypto from 'crypto'
import { PrismaService } from '../prisma/prisma.service'
import { LoginDto } from './dto/login.dto'
import { JwtRefreshPayload } from './strategies/jwt-refresh.strategy'

const REFRESH_TTL_DAYS = 7
const REFRESH_TTL_MS = REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000

export interface IssuedTokens {
  accessToken: string
  refreshToken: string
  refreshTokenMaxAgeMs: number
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.prisma.adminUser.findUnique({
      where: { email: dto.email },
    })

    if (!user || !user.active) {
      throw new UnauthorizedException('Credenciais inválidas')
    }

    const passwordValid = await bcrypt.compare(dto.password, user.passwordHash)
    if (!passwordValid) {
      throw new UnauthorizedException('Credenciais inválidas')
    }

    const tokens = await this.issueTokens(user.id, user.role)

    return {
      ...tokens,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    }
  }

  async getMe(userId: string) {
    const user = await this.prisma.adminUser.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    })

    if (!user) throw new UnauthorizedException()

    return user
  }

  async rotateRefreshToken(userId: string, jti: string): Promise<IssuedTokens> {
    const tokenHash = this.hashJti(jti)
    const stored = await this.prisma.adminRefreshToken.findUnique({
      where: { tokenHash },
    })

    if (!stored || stored.userId !== userId) {
      throw new UnauthorizedException('Refresh token inválido')
    }

    if (stored.revokedAt) {
      // Reuse detection: presented token was already rotated. Revoke the whole family.
      await this.prisma.adminRefreshToken.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      })
      throw new UnauthorizedException('Refresh token reutilizado')
    }

    if (stored.expiresAt.getTime() <= Date.now()) {
      throw new UnauthorizedException('Refresh token expirado')
    }

    const user = await this.prisma.adminUser.findUnique({
      where: { id: userId },
      select: { id: true, role: true, active: true },
    })
    if (!user || !user.active) {
      throw new UnauthorizedException('Usuário inativo')
    }

    await this.prisma.adminRefreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    })

    return this.issueTokens(user.id, user.role)
  }

  async revokeRefreshToken(jti: string): Promise<void> {
    const tokenHash = this.hashJti(jti)
    await this.prisma.adminRefreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    })
  }

  private async issueTokens(userId: string, role: string): Promise<IssuedTokens> {
    const accessToken = this.jwt.sign({ sub: userId, role })

    const jti = crypto.randomUUID()
    const expiresAt = new Date(Date.now() + REFRESH_TTL_MS)
    const refreshPayload: JwtRefreshPayload = { sub: userId, jti }
    const refreshToken = this.jwt.sign(refreshPayload, {
      secret: this.config.getOrThrow<string>('JWT_ADMIN_REFRESH_SECRET'),
      expiresIn: `${REFRESH_TTL_DAYS}d`,
    })

    await this.prisma.adminRefreshToken.create({
      data: {
        userId,
        tokenHash: this.hashJti(jti),
        expiresAt,
      },
    })

    return { accessToken, refreshToken, refreshTokenMaxAgeMs: REFRESH_TTL_MS }
  }

  private hashJti(jti: string): string {
    return crypto.createHash('sha256').update(jti).digest('hex')
  }
}
